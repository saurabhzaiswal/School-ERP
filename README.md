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

Student admission numbers are generated server-side. Attendance is unique per student/date, and changes write audit records. Teacher access is enforced by backend services, not just the UI. The frontend includes staff management and activity screens. Student and staff gender/contact fields are optional.

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
DATABASE_URL="postgresql://postgres:1234@localhost:5432/school_erp?schema=public"
SESSION_SECRET="cbf81c0694507d3e06b2a65821c359efb6b3ec7aa449ea5c84c1df680ee83fdd"
PORT=3000
REDIS_URL="redis://127.0.0.1:6379"
FRONTEND_ORIGIN="http://localhost:5173"
DEMO_PASSWORD="SchoolDemo@2026"
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

For a fresh database, point `DATABASE_URL` at that database, then run `npm run db:migrate` and `npm run db:seed`. **Do not reset or drop an existing database until you have checked the URL and saved any data you need.** `npm run db:seed` can be rerun without duplicating its demo records. It creates one Admin, two Teachers, 12 fictional students with contact fields, and three days of sample attendance. The teacher accounts cover grade 8/A and 9/B; grade 10/A has no assigned demo teacher.

## Demo sign-in

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@school.local` | `SchoolDemo@2026` |
| Teacher | `teacher@school.local` | `SchoolDemo@2026` |

These passwords are local demo credentials only. You can override them with `DEMO_PASSWORD` before seeding. The seed deliberately uses fictional names, `example.test` student email addresses, and reserved 202-555-01xx phone numbers.

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

All HTTP endpoints use `/api` as their prefix. Zod validates request schemas; Nest's global ValidationPipe also checks DTOs. Student PATCH uses a separate partial schema without create defaults, then validates fee rules against the persisted record merged with supplied fields. A name-only edit therefore preserves fee status and amount.

### Key routes

| Method | Path | Description |
| --- | --- | --- |
| POST / GET / POST | `/api/auth/login`, `/api/auth/profile`, `/api/auth/logout` | Login, current profile, logout |
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

Login sessions are stored in Redis via `express-session`. For authenticated write operations, send the `x-csrf-token` header obtained from login or `/api/auth/profile` along with the session cookie. The frontend Axios client handles this. `PATCH /api/users/:id` enforces teacher assignment and last-admin protections; `PATCH /api/students/:id` preserves correct fee status/amount combinations.

## Validation and testing

Run these from `backend`:

```powershell
npm test
npm run lint
npm run build
npm run test:smoke
npm run test:seed
```

Run `npm run test:smoke` **only while** the API, PostgreSQL and Redis are running and the demo database is seeded. It creates and cleans up temporary records. `npm run test:seed` creates, migrates, seeds twice, verifies and drops a disposable PostgreSQL database; the configured database user needs database creation rights. Run `npm run build` and `npm test` from `frontend` as well.

**Verification on 11 October 2026:** Backend build passed; Vitest passed 24 tests across 9 files; the lint command exited successfully with unused-import warnings in older resource files. Frontend build and 3 route tests passed. The live smoke test passed using the existing local demo database, and the fresh-seed check passed twice in a disposable database. The standalone full TypeScript check (`npx tsc --noEmit -p tsconfig.json`) still reports type errors in older `src/http.spec.ts` and `src/rules.spec.ts`; those files are outside the normal Nest build. See [the test results](TECHNICAL_DESIGN.md#8-test-plan-and-results).

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

The automated results and remaining manual checks are recorded in the technical handover. Recheck responsive layouts in a browser on the target machine.

## Known limitations

This is an assignment/demo rather than a production-ready school system. It has no payment ledger, multi-school tenancy, enrollment history, password reset, robust login throttling or comprehensive deployment/backup automation. When a student changes grade/section, access to past attendance follows the current assignment; a production system should model historical enrollment. See [Technical Design and Handover](TECHNICAL_DESIGN.md) for the architecture, data model and fuller API reference.

