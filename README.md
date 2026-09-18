# GritGrid Workbench

Internal employee workbench for GritGrid Technologies.

## Workbench authentication

The Workbench uses server-side Neon PostgreSQL sessions. Copy `.env.example` to `.env.local` and set:

- `DATABASE_URL`: Neon PostgreSQL connection string.
- `GRITGRID_AI_API_URL`: FastAPI workforce URL, such as `https://gritgrid-ai.onrender.com`.
- `GRITGRID_AI_API_TOKEN`: optional server-only bearer token for the FastAPI backend when authentication is enabled.

Create the first owner account from a shell with credentials supplied only through environment variables:

```powershell
$env:DATABASE_URL = "..."
$env:OWNER_NAME = "Your Name"
$env:OWNER_EMAIL = "you@gritgrid.in"
$env:OWNER_PASSWORD = "use-a-strong-password"
pnpm create-owner
```

Sign in at `/login`. Passwords are bcrypt-hashed, and sessions use opaque HTTP-only cookies with an eight-hour expiry. Sign out deletes the database session and clears the cookie. The AI proxy validates that session server-side and allows workforce mutations only for `OWNER` and `MANAGER` accounts.
