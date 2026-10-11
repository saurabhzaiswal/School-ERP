# School ERP Technical Design and Handover

Candidate: Saurabh. Updated: 11 October 2026. This document covers the complete submitted implementation: student directory, daily attendance, fee follow-up, Admin/Teacher access, staff management, and activity log.

## Architecture and decisions

Vue 3 Options API screens use Axios, Pinia, Vue Router, Tailwind, and SCSS. Pinia loads `/api/auth/profile` once after a page reload, then reuses the user during navigation. Route guards redirect guests to Login, signed-in users away from Login, and Teachers away from Admin pages. A protected API 401 clears client identity.

NestJS uses global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, and `transform`. Body DTOs in `src/*/dto` validate field types and nested assignments. Zod also validates query parameters, dates, page limits, and cross-field business rules such as fee status versus due amount. Services apply permissions independently of the UI. Prisma 7 writes to PostgreSQL 18, whose constraints and indexes enforce uniqueness and support paged queries.

`express-session` stores eight-hour sessions in Redis; the HTTP-only, SameSite=Lax cookie contains only the session ID. Login regenerates the session. CSRF tokens are HMAC-bound to the current session ID and required on authenticated writes. Every authenticated request reloads user status and assignments from PostgreSQL so disabling or reassigning a user takes effect immediately. Redis must be available when the API starts. The BullMQ worker remains configured, but session events are no longer queued.

Student, attendance, and user changes write their `ActivityLog` entry in the same PostgreSQL transaction as the main change. Login and logout events are not recorded; older session entries are excluded from activity queries. Activity details exclude passwords, phone numbers, and fee amounts.

## Database

`User` has a unique login email, optional gender and E.164 phone number, bcrypt hash, role, active flag, assignments, and timestamps. `TeacherAssignment` is unique by teacher/grade/section. `Student` has a PostgreSQL 18 UUIDv7 ID, unique server-generated `SCH-YYYY-NNNNNN` admission number, optional gender/email/phone, class, guardian, status, fee status, and decimal due amount. The contact migration is additive, so existing rows retain null values. `Attendance` is unique per student/date and has a correction audit. `ActivityLog` has UUIDv7 ID, actor FK, action, entity type/ID, summary, details, and time. Indexes cover student class/name, fee/class, attendance date/status, user role/status/name, and activity time and actor/time. Existing migrations in `prisma/migrations` must all be applied.

## API summary

All routes start with `/api`. List responses contain `{ items, total, page, per_page, total_pages }` and accept `per_page` from 1 to 100. Login and `/auth/profile` return `x-csrf-token`; Axios sends it on POST, PUT, PATCH, and DELETE.

| Route | Access | Purpose |
| --- | --- | --- |
| `POST /auth/login`, `POST /auth/logout`, `GET /auth/profile` | Public login; signed-in otherwise | Session lifecycle and identity |
| `GET /students`, `GET /students/:id`, `GET /students/dues` | Admin or assigned Teacher; dues Admin only | Paged student directory and outstanding fees |
| `POST /students`, `PATCH /students/:id` | Admin | Create or edit student; admission number is generated |
| `GET /attendance`, `GET /attendance/student/:studentId` | Admin or assigned Teacher | Paged class register and history |
| `POST /attendance`, `PUT /attendance/:id` | Admin or assigned Teacher | Record or correct a mark |
| `GET /users`, `GET /users/stats`, `GET /users/:id` | Admin; self detail allowed | Staff directory and profile |
| `POST /users`, `PATCH /users/:id` | Admin | Provision and edit staff |
| `GET /activity` | Signed in | Teacher sees own changes; Admin filters by `actorId` or `role`; both can use inclusive `dateFrom`/`dateTo` |

Teachers need at least one unique class/section assignment. Admins have no assignment rows. Deactivated users cannot sign in or continue to use an existing session. Admins cannot remove their own Admin access or disable the last active Admin. Password hashes never appear in API responses. A Teacher's query for another `actorId` still returns only their own activity.

## Frontend implementation

The requested reference folders were adapted under `frontend/src/cmp/erp` and `frontend/src/cmp/activity-log`; neither reference project was edited. The School ERP-adapted `client-page.vue` powers student, attendance, dues, and team tables with desktop rows, mobile cards, skeletons, and empty states. Popper positions custom dropdown menus outside scroll containers and flips them near viewport edges. The activity table supports Admin all/mine, role, search, and date filters. Student and staff forms use the shared phone input. A shared font family is applied across sidebar and pages. Toasts, Vue Final Modal, Floating Vue, and v-wave are configured in `frontend/src/main.js`.

## Setup and verification

| Test case | Expected result | Verified by |
| --- | --- | --- |
| New student | Server creates admission number; client cannot supply one | Service test and live smoke |
| Duplicate daily mark | HTTP 409; original mark retained | Service test and live smoke |
| Teacher opens another class | HTTP 403 before a write or data read | Service and HTTP tests |
| Teacher requests another actor's log | Only own actions returned | Activity unit test and live smoke |
| Missing CSRF token on authenticated write | HTTP 403 | Unit test and live smoke |
| Invalid DTO or fee combination | HTTP 400 | Resource DTO tests and live smoke |
| Invalid student/staff contact fields | HTTP 400; valid E.164 accepted | Resource DTO tests and live smoke |
| Activity role and date filters | Only matching staff changes within inclusive dates | Activity unit test and live smoke |
| Page and per-page query | Limited rows with correct pagination metadata | Live smoke |
| Staff deactivation | Existing session loses access on next API request | Live smoke |

Set `DATABASE_URL`, `REDIS_URL`, `SESSION_SECRET`, and `FRONTEND_ORIGIN` in `backend/.env` using `.env.example`; do not commit real credentials. Start PostgreSQL 18 and Redis. In `backend`, run `npm ci`, `npm run db:migrate`, `npm run db:seed`, `npm run start:dev`. In `frontend`, run `npm ci`, `npm run dev`. If port 3000 is already occupied, set `PORT=3001` for the new backend process and update the frontend proxy target for that run.

Backend `npm test`: 24 tests pass across 9 files, including PATCH defaults, contact DTO and activity filter tests. Backend lint exits successfully with unused-import warnings; backend build passes. Frontend 3 route tests and production build pass. A live smoke test on port 3002 with PostgreSQL and Redis passed concurrent duplicate attendance, admission uniqueness, correction audit, partial student updates, cross-class denial, role changes, CSRF and activity visibility. The fresh-seed test applied all migrations and seeded a temporary database twice with stable counts. A standalone full `tsc --noEmit` reports errors in older spec files excluded from the Nest build. Browser visual checks should still be performed before submission.

## Assumptions and limitations

This is a single-school assessment app. It has no self-service invitation email, password reset, login rate limiter, branch tenancy, enrollment-period history, fee ledger, or production deployment. A student's current class controls access to historic marks. Simultaneous corrections use last-write-wins. Redis is used for sessions and BullMQ, not as a general cache of student data. Review dependency advisories and add production controls before using real student information.



