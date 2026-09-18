import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import { randomUUID } from "node:crypto"

const databaseUrl = process.env.DATABASE_URL?.trim()
const name = process.env.OWNER_NAME?.trim()
const email = process.env.OWNER_EMAIL?.trim().toLowerCase()
const password = process.env.OWNER_PASSWORD

if (!databaseUrl || !name || !email || !password) {
  console.error("Set DATABASE_URL, OWNER_NAME, OWNER_EMAIL, and OWNER_PASSWORD before running pnpm create-owner.")
  process.exit(1)
}

const sql = neon(databaseUrl)
await sql`CREATE TABLE IF NOT EXISTS workbench_users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'EMPLOYEE')), status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Disabled')), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_login_at TIMESTAMPTZ)`
await sql`CREATE UNIQUE INDEX IF NOT EXISTS workbench_users_email_lower_idx ON workbench_users (LOWER(email))`
const passwordHash = await bcrypt.hash(password, 12)
const id = `USR-${randomUUID()}`
await sql`INSERT INTO workbench_users (id, name, email, password_hash, role) VALUES (${id}, ${name}, ${email}, ${passwordHash}, 'OWNER')`
console.log(`Created OWNER account ${email} with id ${id}`)