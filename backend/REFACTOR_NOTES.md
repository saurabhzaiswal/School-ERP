# NestJS resource structure refactor

Resources `auth`, `users`, `students`, `attendance`, `activity` each contain a dedicated `*.module.ts`, `*.controller.ts`, `*.service.ts`, and `*.schema.ts`. Existing DTOs and route prefixes are preserved. Prisma, session/CSRF, and validation helpers remain shared infrastructure; the activity queue stays in the activity module area.

## Update API behavior

- `PATCH /api/students/:id`: admin-only; validates partial input, merges existing student fields, validates fee status against balance, writes student and audit log in a transaction.
- `PATCH /api/users/:id`: admin-only; validates partial input, protects last active admin and current admin, updates class assignments and audit log transactionally. Promotion from TEACHER to ADMIN now clears existing teacher class assignments automatically unless the caller explicitly supplies invalid assignments (which are rejected).
- A focused unit spec is provided in `src/update-flow.spec.ts` covering both update flows.

## Verification

TypeScript source syntax and local import paths were checked offline. Dependencies could not be installed in this environment (npm installation timed out), so build, Vitest, and database-backed live API tests have **not** been successfully run. Run `npm ci`, `npm run build`, `npm test`, and your database-backed tests locally after configuring `.env` from `.env.example`.

The original `.env` (potential secrets) and `.git` data were intentionally excluded from the ZIP. No migrations or API prefixes were changed.
