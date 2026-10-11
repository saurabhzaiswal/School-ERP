# School ERP

A small Student, Attendance, and Fee Follow-up module. School staff application with a **Vue 3** frontend and **NestJS 12 / Prisma 7** backend, backed by PostgreSQL 18 and Redis. Demo student names are fictional. The backend has resource-local `auth`, `students`, `attendance`, `users`, and `activity` modules.

## Features and access rules

| Feature | Admin | Teacher |
| --- | --- | --- |
| Student directory, details, search and pagination | All students | Assigned grade/section only |
| Create and update students | Yes | No |
| Record and correct attendance, view history | All classes | Assigned classes only |
| Fee dues list and student fee fields | Yes | No |
| Manage staff accounts and class assignments (`/api/users`) | Yes | No |
| Activity log (`/api/activity`) | All matching events | Own events only |

Student admission numbers are generated server-side. Attendance is unique per student/date, and changes write audit records. Teacher access is enforced by backend services, not just the UI. The backend also supports account activation, gender/contact fields, teacher assignments, and activity filters. There may not be a frontend screen for every API endpoint.

## Requirements

- Node.js **24.12+** and npm **11+**
- Docker Desktop with Compose **or** existing PostgreSQL **18** and Redis services
- A random `SESSION_SECRET` of at least 32 characters

## Start local development (PowerShell)

From the repository root:

```powershell
docker compose up -d
Copy-Item backend/.env.example backend/.env
```

Edit `backend/.env` before starting the API. With the **default** Compose values, set:

```dotenv
DATABASE_URL="postgresql://school:school_local_only@localhost:5432/school_erp?schema=public"
REDIS_URL="redis://127.0.0.1:6379"
SESSION_SECRET="replace-with-a-random-secret-of-at-least-32-characters"
PORT=3000
FRONTEND_ORIGIN="http://localhost:5173"
```

Do **not** use the demo database password or example session secret for real deployments. If you already have local database/Redis servers, use their actual URLs and avoid conflicting Compose ports.

Backend terminal (from the project root):

```bash
cd backend
npm ci
npx prisma generate
npm run db:migrate
npm run db:seed
npm run start:dev
```

Frontend terminal (from the project root, in a separate terminal):

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. The Vite development proxy targets the backend at `http://localhost:3000/api`.

> Database reset deletes all records in the selected database: `cd backend; npx prisma migrate reset --force; npm run db:seed`. Double-check `DATABASE_URL` before running. Prisma may automatically run the configured seed during reset; the second seed is unnecessary if it already ran. For ordinary updates use `npm run db:migrate`, not a reset.

## Demo sign-in

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@school.local` | `SchoolDemo@2026` |
| Teacher | `teacher@school.local` | `SchoolDemo@2026` |

The bundled seed assigns the demo teacher to grade 8, section A. If you replaced the seed with an expanded version, verify the latest accounts and class assignments in `backend/prisma/seed.ts`. You can override the demo password using `DEMO_PASSWORD` before seeding.

## Backend structure

```text
backend/
  src/
    auth/         auth.module.ts, auth.controller.ts, auth.service.ts, auth.schema.ts
    students/     students.module.ts, students.controller.ts, students.service.ts, students.schema.ts, dto/
    attendance/   attendance.module.ts, attendance.controller.ts, attendance.service.ts, attendance.schema.ts, dto/
    users/        users.module.ts, users.controller.ts, users.service.ts, users.schema.ts, dto/
    activity/     activity.module.ts, activity.controller.ts, activity.service.ts, activity.schema.ts
    prisma.module.ts, prisma.service.ts, session.ts, validation.ts, app.module.ts
  prisma/         schema.prisma, migrations/, seed.ts
```

All HTTP endpoints use `/api` as their prefix. Zod validates request schemas; Nest's global ValidationPipe also checks DTOs. For student PATCH requests, the **locally fixed version** should use a separate partial update schema. Do not call `.partial()` directly on a refined create schema (Zod v4 throws). Do not allow create defaults to overwrite omitted PATCH fields. The service should validate the merged persisted and patched fee values. **Important:** the earlier `backend_refactored.zip` still contains `studentSchema.safeExtend({}).partial().strict()`; confirm the fixed local source is what you submit.

### Key routes

| Method | Path | Description |
| --- | --- | --- |
| POST / GET / POST | `/api/auth/login`, `/api/auth/me`, `/api/auth/logout` | Login, session, logout |
| GET, POST | `/api/students` | List/create students |
| GET, PATCH | `/api/students/:id` | Student details/update |
| GET | `/api/students/dues` | Outstanding fee list (Admin) |
| GET, POST | `/api/attendance` | Register/record attendance |
| GET | `/api/attendance/student/:studentId` | Attendance history |
| PUT | `/api/attendance/:id` | Attendance correction |
| GET, POST | `/api/users` | Staff listing/create (Admin) |
| GET | `/api/users/stats` | Staff role statistics (Admin) |
| GET, PATCH | `/api/users/:id` | Staff details/update (Admin) |
| GET | `/api/activity` | Activity audit list |

Login sessions are stored in Redis via `express-session`. For authenticated write operations, send the `x-csrf-token` header obtained from login or `/api/auth/me` along with the session cookie. The frontend Axios client handles this. `PATCH /api/users/:id` enforces teacher assignment and last-admin protections; `PATCH /api/students/:id` must preserve correct fee status/amount combinations.

## Validation and testing

Run these from `backend`:

```powershell
npm test
npm run lint
npm run build
npm run test:smoke
```

Run `npm run test:smoke` **only while** the API, PostgreSQL and Redis are running and the demo database is seeded. It exercises real HTTP/database paths, so use an isolated development/test database. Run `npm run build` separately from `frontend` to verify the Vue build.

**Verification note:** The refactored backend was not fully built or live-tested in this editing environment; earlier test results do not verify the latest source or configuration. After applying the student PATCH fix locally, rerun every command above and record results in the handover.

## PM2 deployment

From the project root, after configuring deployment environment and installing dependencies:

```powershell
cd backend
npm ci
npx prisma generate
npm run db:migrate
npm run build
cd ..
npm install -g pm2
pm2 start pm2.config.js
pm2 logs school-erp-api
```

`pm2.config.js` runs **one** backend process from `backend/`. Redis must be available for sessions and the activity worker. For production, use private database/Redis networking, an HTTPS reverse proxy, secure credentials, backups and monitoring. The application sets secure cookies in production, so login requires HTTPS. Separate the HTTP service and BullMQ worker before scaling to multiple API processes.

## Reproducible manual checks

1. Sign in as Admin. Create two students; confirm generated admission numbers differ, then search by name/admission number and filter grade/section.
2. Edit **only** a student name via PATCH, then reload the student. Verify `active`, `feeStatus`, and `amountDue` did not change. Also test a valid simultaneous fee-status/due update and an invalid combination.
3. Record a student as PRESENT for a date, repeat the same POST (expect HTTP 409), then correct to LATE and check history.
4. Sign in as Teacher, attempt a direct GET/POST for a student outside assigned grade/section (expect HTTP 403). Confirm teachers cannot access `/api/students/dues` or `/api/users`.
5. As Admin, change a Teacher to Admin and verify assignments are cleared; check protected last-admin rules.

Record *actual* results before marking these tests as passed.

## Known limitations

This is an assignment/demo rather than a production-ready school system. It has no payment ledger, multi-school tenancy, enrollment history, password reset, robust login throttling or comprehensive deployment/backup automation. When a student changes grade/section, access to past attendance follows the current assignment; a production system should model historical enrollment. See [Technical Design and Handover](TECHNICAL_DESIGN.md) for the architecture, data model and fuller API reference.

