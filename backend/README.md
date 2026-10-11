# School ERP backend

The API provides student records, attendance, fee follow-up, staff accounts, and an activity log. PostgreSQL 18 and Redis must be running. Configure `.env` from `.env.example` with `DATABASE_URL`, `REDIS_URL`, and a random `SESSION_SECRET` (at least 32 characters). Run `npm ci`, `npm run db:migrate`, `npm run db:seed`, and `npm run start:dev`. Use `npm test`, `npm run lint`, `npm run build`, and `npm run test:smoke` to verify it. The smoke test needs the API, PostgreSQL, and Redis running.

Admins manage staff through `/api/users` (`GET`, `POST`, `GET /:id`, `PATCH /:id`); `GET /api/users/stats` returns role counts. Teacher accounts need at least one grade/section assignment. Inactive accounts cannot sign in or use an existing session. The last active admin cannot be disabled. User responses never include password hashes.

`GET /api/activity?page=1&per_page=20&q=...&actorId=...&role=TEACHER&dateFrom=2026-10-01&dateTo=2026-10-11` shows the audit trail. Admins can filter by actor, role, and inclusive date range; teachers always see only their own actions. Student and staff changes and attendance marks/corrections are logged in the same database transaction as the change. Sign-in/sign-out events are not recorded, and older session entries are hidden. Passwords, phone numbers, and fee values are not stored in activity details.

The latest additive migration adds optional gender and international phone number fields to staff and students, plus an optional student email. Staff email remains required for sign-in. Phone numbers must use E.164 format such as `+919876543210`. Existing rows remain valid with null contact fields.

Sessions use `express-session` with a Redis store. The cookie contains only a session ID; the API reloads current user status and assignments from PostgreSQL for authorization, so deactivation takes effect immediately. CSRF tokens are HMAC bound to the session ID and required for authenticated writes. Global `ValidationPipe` validates DTOs and rejects unknown body fields; the existing Zod schemas also validate query strings and cross-field business rules. Redis is required at startup. See `src/*/dto` and the resource-local `*.spec.ts` files.

See the [project README](../README.md) for the original assignment setup and scope. The new API behavior above supersedes its older user-management limitation.

For a deployed API, build with `npm run build`, then run `pm2 start ../pm2.config.js` from this directory after installing PM2. The root config runs one backend instance from the backend working directory, so `.env` resolves correctly. PM2 restarts a crashed process and collects logs; use `npm run start:dev` for local watch mode. Do not run both against the same `PORT`, or startup will fail with `EADDRINUSE`. One instance avoids multiplying the BullMQ worker; scaling web and queue workers separately would need an explicit process split.
