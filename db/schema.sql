CREATE TABLE IF NOT EXISTS workbench_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'EMPLOYEE')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS workbench_users_email_lower_idx
  ON workbench_users (LOWER(email));

CREATE TABLE IF NOT EXISTS workbench_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES workbench_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workbench_sessions_user_idx
  ON workbench_sessions (user_id);

CREATE INDEX IF NOT EXISTS workbench_sessions_expiry_idx
  ON workbench_sessions (expires_at);