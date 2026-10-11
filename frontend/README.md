# School ERP frontend

After starting the backend, run `npm ci` and `npm run dev`, then open `http://localhost:5173`. Use `npm test` for route decisions and `npm run build` for a production build.

The Pinia session store loads `/auth/profile` once per page load. Router guards send guests to `/login`, send signed-in users away from `/login`, block teacher access to admin pages, and redirect unknown paths to `/`. The Axios client sends the session cookie and CSRF token; expired sessions clear local identity and return to login.

Admins can create, edit, and deactivate staff in **User management**. Teachers and admins can review their permitted entries in **Activity log**; admins can filter by role and everyone/themselves, and both roles can filter by dates. Adapted reference components live under `src/cmp/erp` and `src/cmp/activity-log`. The `client-page.vue` table powers student, attendance, dues, and user lists; the activity panel uses a scrollable table with headers. Shared search, Popper-positioned dropdown, checkbox, input, date picker, phone input, pagination, and modal close components keep forms and lists consistent.

See the [project README](../README.md) for the original assignment setup and demo accounts.
