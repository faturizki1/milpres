# Admin Dashboard (Next.js App Router)

This app contains the admin dashboard scaffold (App Router). It includes client-side `AuthProvider` which stores `access_token` in memory and relies on the auth service to set `refresh_token` httpOnly cookie.

Run:

```bash
cd apps/admin-dashboard
npm install
npm run dev
```

Environment:
- `NEXT_PUBLIC_AUTH_URL` (optional) — default `http://localhost:4001`
