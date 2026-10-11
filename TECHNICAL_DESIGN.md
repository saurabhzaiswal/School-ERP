# School ERP Technical Design and Handover

Candidate: Saurabh · Version: 1.1 · 11 October 2026 · Project: School ERP assessment · Stack: Vue 3 / NestJS 12 / Prisma 7 / PostgreSQL 18

This document describes the implementation in this folder. It covers the required student, attendance, fee follow-up, and role flows, then explains how to run and verify them. A local PostgreSQL 18 database was migrated and seeded, and a live API smoke test passed.

## 1. Executive summary and scope

The application gives school staff a student directory, daily class register, individual attendance history, and an Admin-only list of outstanding fee amounts. Admins can maintain student records and attendance. Teachers can read students and manage attendance for their assigned class/section. The bundled seed assigns the demo teacher to class 8 section A; consult `backend/prisma/seed.ts` if using an expanded replacement. Admins can also manage users and class assignments through the staff API, and staff activity is queryable.

All required assignment flows are implemented in code. Authentication uses local seeded accounts. Optional attendance audit is implemented. CSV export, payment gateway, fee ledger, branch support, a full deployment stack, and account-management **frontend UI** are outside scope; account-management **backend routes** exist. A student's current class/section controls access to their entire history; enrollment history would be needed for a production transfer workflow.

## 2. Technology stack and rationale

| Layer | Choice | Reason |
| --- | --- | --- |
| UI | Vue 3 Options API, Vite, Vue Router, Axios | Modular screens, credentialed API client, lazy route chunks |
| Styling | Tailwind CSS and SCSS | Fast responsive layout with a small set of reusable design rules |
| API | Node.js 24, NestJS 12, TypeScript | Clear controllers/services and predictable HTTP errors |
| Validation | Zod 4 | Shared-shaped runtime input rules and safe rejection of unknown fields |
| Data | PostgreSQL 18, Prisma ORM 7 | Relational constraints, typed queries, UUIDv7 database defaults |
| Authentication | bcryptjs, Redis-backed express-session and HTTP-only cookie | Password hash at rest; session ID in cookie, CSRF protection |
| Tests | Vitest and live smoke script | Service rules and real HTTP/database checks when run locally |

The frontend uses Vue Final Modal, vue-select, v-wave, vue-toastification, vue3-click-away, Moment, and Floating Vue tooltips. The requested `v-tooltip@2.1.3` targets Vue 2, so Floating Vue supplies the Vue 3-compatible directive. The supplied Lottie file is used for full-page loading; tables show lightweight skeletons. A server-rendered application was considered, but Vue and NestJS align with the supplied starter projects and make the API permission boundary explicit.

## 3. Architecture and request flow

```mermaid
flowchart LR
  UI[Vue Options API screens] --> API[NestJS resource controllers]
  API --> V[DTO and Zod validation]
  V --> S[Auth Students Attendance Users Activity services]
  S --> P[Prisma Client and pg adapter]
  P --> DB[(PostgreSQL 18)]
  API --> SESSION[Redis-backed sessions]
  S --> QUEUE[BullMQ activity queue on Redis]
```

For a teacher recording attendance, the UI sends a student ID, date, and status. The controller validates the body. `AttendanceService` loads the student, checks that the teacher has the student's class/section assignment, rejects inactive students, then creates attendance and audit rows in one transaction. A database unique index on `(studentId, date)` rejects concurrent duplicate requests. The service translates that constraint error to HTTP 409. NestJS returns validation errors as 400, missing rows as 404, missing sessions as 401, and forbidden class access as 403.

## 4. Data model and constraints

```mermaid
erDiagram
  User ||--o{ TeacherAssignment : has
  User ||--o{ Attendance : records
  User ||--o{ AttendanceAudit : changes
  Student ||--o{ Attendance : has
  Attendance ||--o{ AttendanceAudit : logs
  User ||--o{ ActivityLog : performs
```

| Entity | Key fields and relationships | Constraints and indexes |
| --- | --- | --- |
| User | UUIDv7 ID, unique email, bcrypt password hash, Admin/Teacher role, active flag, contact fields | Email unique |
| TeacherAssignment | UUIDv7 ID, user FK, grade, section | Unique `(teacherId, grade, section)`; grade/section index |
| Student | UUIDv7 ID, admission number, name, gender, optional email/phone, grade, section, guardian, active, fee status, decimal due | Admission number unique; class/name and fee/class indexes; SQL check requires paid = zero due and outstanding = positive due |
| Attendance | UUIDv7 ID, student FK, date, Present/Absent/Late, recording user FK, timestamps | Unique `(studentId, date)`; date/status index |
| AttendanceAudit | UUIDv7 ID, attendance FK, changing user FK, old/new status, timestamp | Attendance/time index |
| ActivityLog | Actor, action, entity type/ID, summary, safe details, time | Queryable staff activity stream |

The migration uses PostgreSQL 18 `uuidv7()` defaults. A PostgreSQL sequence allocates admission numbers in `SCH-YYYY-NNNNNN` form; the API never accepts this field on create or update. The service maps Prisma unique-constraint errors to HTTP 409. The assignment requests duplicate rejection; server generation avoids typical duplicate input, while uniqueness in PostgreSQL remains the ultimate protection. `amountDue` is `DECIMAL(12,2)` to avoid floating-point storage for currency. `guardianName` and other identifying fields are non-null. The database unique indexes remain authoritative during concurrent writes.

## 5. API reference

All routes start with `/api`. JSON request and response bodies are used. List responses contain `{ items, total, page, per_page, total_pages }`; `per_page` accepts 1 through 100 and the UI offers 10, 20, 50, or 100. The former `limit` query remains accepted for compatibility.

| Method | Route | Purpose and key request fields | Role | Success / common errors |
| --- | --- | --- | --- | --- |
| POST | `/auth/login` | Email, password; sets signed cookie | Public | 201; 400, 401 |
| GET | `/auth/me` | Current role and assignments | Signed in | 200; 401 |
| POST | `/auth/logout` | Clears cookie | Any | 201 |
| GET | `/students` | `q`, `grade`, `section`, `page`, `per_page` | Admin; assigned Teacher | 200; 400, 401 |
| GET | `/students/:id` | Student detail | Admin; assigned Teacher | 200; 401, 403, 404 |
| POST | `/students` | Name, grade, section, guardian, active, fee status, due; admission number generated | Admin | 201; 400, 401, 403, 409 |
| PATCH | `/students/:id` | Any supported student fields | Admin | 200; 400, 401, 403, 404, 409 |
| GET | `/students/dues` | Search and page students with pending/partial fees | Admin | 200; 400, 401, 403 |
| GET | `/attendance` | `grade`, `section`, `date=YYYY-MM-DD`, `page`, `per_page`; returns paged marks and full-class totals | Admin; assigned Teacher | 200; 400, 401, 403 |
| GET | `/attendance/student/:studentId` | Paged attendance history | Admin; assigned Teacher | 200; 400, 401, 403, 404 |
| POST | `/attendance` | `studentId`, `date`, `status` | Admin; assigned Teacher | 201; 400, 401, 403, 404, 409 |
| PUT | `/attendance/:id` | `{ status }` correction | Admin; assigned Teacher | 200; 400, 401, 403, 404 |
| GET | `/users` | List/search staff with pagination | Admin | 200; 401, 403 |
| GET | `/users/stats` | Role statistics | Admin | 200; 401, 403 |
| GET | `/users/:id` | Staff details and assignments | Admin | 200; 401, 403, 404 |
| POST | `/users` | Create staff account and assignments | Admin | 201; 400, 401, 403, 409 |
| PATCH | `/users/:id` | Partial staff update, role/active/assignment changes | Admin | 200; 400, 401, 403, 404, 409 |
| GET | `/activity` | Filterable activity log | Admin: all; Teacher: own | 200; 400, 401, 403 |

Example: `GET /api/students?q=aar&page=1&per_page=20`. A new mark is `POST /api/attendance` with `{"studentId":"<uuid>","date":"2026-10-10","status":"PRESENT"}`. A correction is `PUT /api/attendance/<attendance-id>` with `{"status":"LATE"}`. History uses `GET /api/attendance/student/<student-id>?page=1&per_page=20`. Pending dues use `GET /api/students/dues?q=diya`. After login or `GET /auth/me`, the `x-csrf-token` response header must be sent on writes.

## 6. Authentication and authorisation

The seed creates Admin and Teacher accounts with bcrypt hashes. Login uses an eight-hour Redis-backed `express-session` session. The HTTP-only, SameSite=Lax cookie contains a session ID; `Secure` is enabled in production. The API loads the user and assignments from the database for each authenticated request. Admin-only methods call `auth.admin`. Student-detail and history reads, class register reads, attendance creation, and corrections call `auth.classroom` using a server-loaded student or the requested class/section. Student listing adds an assignment predicate to its database query and strips fee fields from teacher responses. A changed URL or forged student ID cannot remove these server checks.

State-changing requests with a session require an HMAC-derived CSRF token. Login and `GET /auth/me` return it in the `x-csrf-token` response header; the Axios client retains and sends it. Before real use, add login rate limiting, credential rotation, TLS-only deployment, and session revocation. Redis must be available at startup for session storage and BullMQ. For deployment, add TLS, rate limiting, session revocation, credential rotation and monitoring.

## 7. Local setup and operation

Use Node.js 24.12+, npm 11+, and PostgreSQL 18. Run `docker compose up -d` to start **PostgreSQL 18 and Redis** for local development if they are not already available. The Compose ports are bound to localhost and the default credentials are demo-only. Copy `backend/.env.example` to `backend/.env`; set `DATABASE_URL`, `REDIS_URL`, a random `SESSION_SECRET` of at least 32 characters, optional `PORT`, and `FRONTEND_ORIGIN`. With default Compose values, use `postgresql://school:school_local_only@localhost:5432/school_erp?schema=public` and `redis://127.0.0.1:6379`. No real secrets belong in the repository.

In `backend`, run `npm ci`, `npm run db:migrate`, `npm run db:seed`, and `npm run start:dev`. In `frontend`, run `npm ci` and `npm run dev`. Visit `http://localhost:5173`. Local-only demo logins are `admin@school.local` and `teacher@school.local`, both with `SchoolDemo!2026` unless `DEMO_PASSWORD` was set before seeding. The bundled demo teacher has class 8 section A. If using an expanded replacement seed, confirm its class assignments. `npm test`, `npm run lint`, and `npm run build` run backend checks; `npm run test:smoke` runs the live local database check while the API is up; `npm run build` checks the frontend.

## 8. Test plan and current verification status

| Case | Expected behaviour | What to verify |
| --- | --- | --- |
| Student create | Database-generated unique `SCH-YYYY-NNNNNN`; no client-supplied admission number | POST and duplicate/concurrency tests |
| Student PATCH | Updating only `name` or `grade` must not reset omitted defaults | PATCH name-only, field-only and combined fee updates |
| Student fee validation | Paid has zero due; outstanding statuses have positive due | Test PATCH against both existing and incoming values; check DB constraint |
| User PATCH | Role, active state and assignments update correctly | Teacher→Admin, Admin→Teacher, last-admin protection |
| Duplicate attendance | HTTP 409; original attendance unchanged | Duplicate date and simultaneous writes |
| Attendance correction | New status and audit entry | Write with CSRF, then query history/audit |
| Classroom isolation | Teacher cannot access another grade/section | GET by ID, register, history and mark writes |
| CSRF and authentication | Unauthorized writes rejected; authorized session succeeds | Login/me header and cookie flow |
| Search and pagination | Correct items, totals and role visibility | Students, users, dues, activity and attendance |
| Queue/session dependencies | Session and background queue start successfully | PostgreSQL and Redis both healthy |

**Current status (not a fresh pass report):** The previous project handover reported 12 passing backend tests and a successful historical live smoke check **before** the later refactor. The refactored ZIP, any later local student PATCH fix, the expanded seed, and updated Compose/PM2 configurations were not run together in this editing environment. No new passing results are claimed. Run backend `npm test`, `npm run lint`, `npm run build`, `npm run test:smoke` and frontend `npm run build` locally; the smoke test needs the API and both data services running. Pay special attention to student partial-update behaviour and user role/assignment updates.

### Manual test reproduction and result log

All commands below are for a **local seeded test environment**. Sign in using the browser frontend so the session cookie and `x-csrf-token` are sent for writes.

| Scenario | Steps | Expected | Actual / status |
| --- | --- | --- | --- |
| Student edit | Admin PATCH `{ "name": "Updated Name" }` on a student | 200; unrelated fields unchanged | Record after running |
| Fee consistency | PATCH `{"feeStatus":"PAID","amountDue":100}` | 400 (or DB constraint error translated safely); no invalid record | Record after running |
| Duplicate attendance | POST same `studentId` and `date` twice | Second request 409; first preserved | Record after running |
| Attendance correction | PUT existing attendance with different status | 200, history and audit updated | Record after running |
| Cross-class access | Teacher from grade 8/A GET student in grade 9/B, then attempt attendance POST | 403 for both | Record after running |
| Unauthenticated write | PATCH without valid session/CSRF token | 401 or 403, no mutation | Record after running |
| User role transition | Admin PATCH Teacher role to ADMIN | Valid role change, assignments cleared | Record after running |

No new pass/fail values have been fabricated for the current revision.

## 9. Security, limitations, and operation

The backend `.env` and generated client should be excluded from version control. Audit the final Git diff for secrets before submission. Passwords are hashed. The UI is marked `noindex`, as this is a private staff tool; public SEO would be inappropriate for student records. The API returns safe messages for invalid, missing, duplicate, and unauthorised requests. No real student data is included.

The current system has no rate limiter, password reset, staff-management frontend UI, multi-branch tenancy, enrollment history, file export, fee ledger, backups, or operational monitoring. Staff administration **API** routes are available. An admin changing a student's class immediately changes which teacher may see their historical marks. Simultaneous corrections currently use last-write-wins semantics; a version field would prevent lost updates. Redis is used for session storage and BullMQ activity processing, not as a query cache. It must be running for this backend setup. Review current dependency advisories and upgrade affected packages before deployment. These limits must be addressed before real school data is used.

## 10. Next steps and scale

1. Run the live smoke test in CI and add two concurrent attendance-write cases.
2. Add login throttling, staff-management UI, session revocation, and password reset.
3. Model enrollment periods and teacher assignment periods so past records keep their original access context.
4. Add branch IDs to all entities and composite branch-scoped unique indexes before serving multiple schools.
5. For 10,000+ students, measure actual list queries, add targeted indexes and keyset pagination where needed, then add backup, monitoring, and deployment automation.

## 11. AI and external resources disclosure

AI tools (OpenAI ChatGPT) were used to assist with code generation, debugging, refactoring, testing support, and documentation. Official NestJS, Prisma ORM, PostgreSQL, Vue.js, and other relevant library documentation were referenced during development.

The final implementation was reviewed and refined through manual debugging and testing. I can explain the architectural decisions, business logic, and implementation details, and make changes as required.

## Appendix A. Quick API reference

| Method | Endpoint | Purpose | Role | Main validation or error |
| --- | --- | --- | --- | --- |
| GET/POST/PATCH | `/api/students`, `/api/students/:id` | Search and maintain students | Teacher read by assignment; Admin write | 403, 404, duplicate admission 409 |
| GET | `/api/students/dues` | Search pending amounts | Admin | 403 |
| GET/POST/PUT | `/api/attendance`, `/api/attendance/:id` | View, record, correct marks | Assigned Teacher or Admin | 403, duplicate date 409 |
| GET | `/api/attendance/student/:studentId` | Paged history | Assigned Teacher or Admin | 403, 404 |
| GET/POST/PATCH | `/api/users`, `/api/users/:id` | Staff CRUD, assignments | Admin | 400, 403, 404, 409 |
| GET | `/api/users/stats` | Role counts | Admin | 403 |
| GET | `/api/activity` | Paged/filterable activity feed | Admin all; Teacher own | 400, 403 |

## Appendix B. Data entities

| Table | Key fields | Relationships | Main constraint |
| --- | --- | --- | --- |
| User | UUIDv7 ID, email, role, active, optional phone/gender | Assignments, attendance, audits | Unique email |
| TeacherAssignment | Teacher ID, grade, section | User FK | Unique teacher/class/section |
| Student | UUIDv7 ID, admission number, class/section, fee status/due | Attendance | Unique admission; fee/due check |
| Attendance | Student ID, date, status | Student and User FKs | Unique student/date |
| AttendanceAudit | Attendance ID, old/new status | Attendance and User FKs | Indexed by attendance/time |
| ActivityLog | Actor, action, entity, summary, details | User FK | Query and date filters |

## Appendix C. Refactor, PATCH schemas and operations

The NestJS backend uses one module, controller, service and local Zod schema per resource: `auth`, `students`, `attendance`, `users` and `activity`. Prisma, request validation, CSRF and Redis sessions remain shared infrastructure. The activity worker runs through BullMQ backed by Redis.

A Zod v4 object schema with `.refine()` cannot be passed directly to `.partial()`. Keep a base object schema, derive a create schema with complete cross-field checks, and build a PATCH schema using optional fields **without reapplying create-only defaults**. The update service must merge the persisted record with supplied fields before validating business invariants. This is required for name-only edits and isolated `feeStatus` or `amountDue` updates. The earlier refactored ZIP still used `studentSchema.safeExtend({}).partial().strict()` in its PATCH controller, whereas the developer subsequently reported a working local fix. **Verify the submitted source contains the local fix** and retest both name-only and fee-only patches; this document cannot certify changes absent from the ZIP.

The root `docker-compose.yml` provides development-only PostgreSQL and Redis, with local port bindings and named volumes. `pm2.config.js` runs one API instance after build from the backend directory. In production use a managed/private database and Redis, unique secrets, TLS/HTTPS, monitoring, backups and an explicitly separated worker deployment if scaling API instances.
