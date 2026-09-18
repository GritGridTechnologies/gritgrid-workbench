import "server-only"

import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import { createHash, randomBytes, randomUUID } from "node:crypto"
import { cookies } from "next/headers"
import type { Role } from "./types"
import type { AuthSession, AuthUser } from "./auth-types"

export const SESSION_COOKIE = "gg_session"
export const SESSION_TTL_SECONDS = 60 * 60 * 8

type UserRow = {
  id: string
  name: string
  email: string
  role: Role
  status: "Active" | "Disabled"
}

let schemaPromise: Promise<void> | null = null

function database() {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) throw new Error("DATABASE_URL is not configured")
  return neon(url)
}

export function ensureAuthSchema() {
  if (!schemaPromise) {
    const sql = database()
    schemaPromise = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS workbench_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'EMPLOYEE')),
        status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Disabled')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMPTZ
      )`
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS workbench_users_email_lower_idx ON workbench_users (LOWER(email))`
      await sql`CREATE TABLE IF NOT EXISTS workbench_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES workbench_users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`
      await sql`CREATE INDEX IF NOT EXISTS workbench_sessions_user_idx ON workbench_sessions (user_id)`
      await sql`CREATE INDEX IF NOT EXISTS workbench_sessions_expiry_idx ON workbench_sessions (expires_at)`
    })().catch((error) => {
      schemaPromise = null
      throw error
    })
  }
  return schemaPromise
}

function toUser(row: UserRow): AuthUser {
  return { id: row.id, name: row.name, email: row.email, role: row.role, status: row.status }
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  }
}

export async function authenticate(email: string, password: string) {
  await ensureAuthSchema()
  const sql = database()
  const rows = (await sql`SELECT id, name, email, password_hash, role, status FROM workbench_users WHERE LOWER(email) = LOWER(${email.trim()}) LIMIT 1`) as Array<UserRow & { password_hash: string }>
  const row = rows[0]
  if (!row || row.status !== "Active" || !(await bcrypt.compare(password, row.password_hash))) {
    throw new Error("Invalid email or password")
  }

  const token = randomBytes(32).toString("base64url")
  const sessionId = randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000)
  await sql`INSERT INTO workbench_sessions (id, user_id, token_hash, expires_at) VALUES (${sessionId}, ${row.id}, ${hashToken(token)}, ${expiresAt})`
  await sql`UPDATE workbench_users SET last_login_at = NOW(), updated_at = NOW() WHERE id = ${row.id}`
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, cookieOptions())
  return { user: toUser(row), expiresAt: expiresAt.toISOString() } satisfies AuthSession
}

export async function getSession(): Promise<AuthSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null
  await ensureAuthSchema()
  const sql = database()
  const rows = (await sql`SELECT u.id, u.name, u.email, u.role, u.status, s.expires_at FROM workbench_sessions s JOIN workbench_users u ON u.id = s.user_id WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > NOW() AND u.status = 'Active' LIMIT 1`) as Array<UserRow & { expires_at: string }>
  const row = rows[0]
  if (!row) {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE)
    return null
  }
  return { user: toUser(row), expiresAt: new Date(row.expires_at).toISOString() }
}

export async function destroySession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token && process.env.DATABASE_URL) {
    await ensureAuthSchema()
    const sql = database()
    await sql`DELETE FROM workbench_sessions WHERE token_hash = ${hashToken(token)}`
  }
  cookieStore.delete(SESSION_COOKIE)
}

export async function requireSession() {
  const session = await getSession()
  if (!session) throw new AuthError("Authentication required", 401)
  return session
}

export async function requireRole(roles: readonly Role[]) {
  const session = await requireSession()
  if (!roles.includes(session.user.role)) throw new AuthError("You are not authorized for this action", 403)
  return session
}

export class AuthError extends Error {
  constructor(message: string, public status: 401 | 403) {
    super(message)
    this.name = "AuthError"
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function createOwner(name: string, email: string, password: string) {
  await ensureAuthSchema()
  const sql = database()
  const passwordHash = await hashPassword(password)
  const id = `USR-${randomUUID()}`
  await sql`INSERT INTO workbench_users (id, name, email, password_hash, role) VALUES (${id}, ${name.trim()}, ${email.trim().toLowerCase()}, ${passwordHash}, 'OWNER')`
  return id
}