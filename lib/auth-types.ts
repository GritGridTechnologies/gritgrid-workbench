import type { Role } from "./types"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
  status: "Active" | "Disabled"
}

export interface AuthSession {
  user: AuthUser
  expiresAt: string
}