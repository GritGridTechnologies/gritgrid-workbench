import type { Role } from "./types"

/**
 * Central capability map. UI hides what a role can't do, but every mutation
 * in the demo store also re-checks these — hiding UI is never the only guard.
 * When this is wired to Neon, the same checks run in Server Actions/route
 * handlers against the session role.
 */
export const CAPABILITIES = {
  "finance.viewAll": ["OWNER"],
  "finance.viewOperational": ["OWNER", "MANAGER"],
  "audit.view": ["OWNER"],
  "team.manage": ["OWNER"],
  "employees.manage": ["OWNER", "MANAGER"],
  "projects.create": ["OWNER", "MANAGER"],
  "projects.edit": ["OWNER", "MANAGER"],
  "tasks.assign": ["OWNER", "MANAGER"],
  "leave.decide": ["OWNER", "MANAGER"],
  "stats.request": ["OWNER", "MANAGER", "EMPLOYEE"],
  "stats.approveManager": ["MANAGER", "OWNER"],
  "stats.approveOwner": ["OWNER"],
  "settings.system": ["OWNER"],
} as const

export type Capability = keyof typeof CAPABILITIES

export function can(role: Role | undefined, capability: Capability): boolean {
  if (!role) return false
  return (CAPABILITIES[capability] as readonly Role[]).includes(role)
}

export const ROLE_LABEL: Record<Role, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
}

export const ROLE_BADGE: Record<Role, "purple" | "default" | "muted"> = {
  OWNER: "purple",
  MANAGER: "default",
  EMPLOYEE: "muted",
}
