# School ERP assignment submission

This archive contains the NestJS backend and Vue 3 frontend. PostgreSQL 18 and Redis are required locally. The application covers student records, attendance, fee follow-up, Admin/Teacher access, staff management, and an activity log.

## Run locally

1. Create the `school_erp` PostgreSQL database and start Redis on port 6379.
2. Copy `backend/.env.example` to `backend/.env`. Set `DATABASE_URL`, `REDIS_URL`, a random `SESSION_SECRET` of at least 32 characters, and `FRONTEND_ORIGIN=http://localhost:5173`.
3. In `backend`, run `npm ci`, `npm run db:migrate`, `npm run db:seed`, `npm run start:dev`.
4. In `frontend`, run `npm ci`, `npm run dev`, then open `http://localhost:5173`.

The seed creates `admin@school.local` and `teacher@school.local` with `SchoolDemo@2026` unless `DEMO_PASSWORD` was set before seeding. Change demo credentials before any nonlocal use. If port 3000 is occupied, set another `PORT` and set `VITE_API_PROXY_TARGET` to its URL when running the frontend.

## Verify

In `backend`, run `npm test`, `npm run lint`, `npm run build`. With the API, PostgreSQL, and Redis running, `npm run test:smoke` checks the HTTP flow. Set `SMOKE_BASE_URL` when the API uses a port other than 3000. In `frontend`, run `npm test` and `npm run build`.

Read `backend/TECHNICAL_DESIGN.md` for current architecture, data model, API, validation, tests, assumptions, limits, and AI/reference disclosure. The body DTOs and resource-local tests are in `backend/src/*`.

