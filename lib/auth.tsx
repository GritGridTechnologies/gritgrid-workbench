"use client"

import * as React from "react"
import { employees } from "./mock-data"
import type { Employee, Role } from "./types"

/**
 * ---------------------------------------------------------------------------
 * DEMO AUTH (simulated)
 * ---------------------------------------------------------------------------
 * This is a clearly-marked simulated auth layer for the UI build. It does NOT
 * perform real authentication. When wired to Neon + a real auth provider, the
 * session is issued server-side and this context reads the authenticated user.
 * The shared demo password is intentionally public for the preview.
 */
export const DEMO_PASSWORD = "gritgrid"
const SESSION_COOKIE = "gg_session"

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name + "=([^;]*)"),
  )
  return match ? decodeURIComponent(match[1]) : null
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 8}; SameSite=Lax`
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
}

interface AuthContextValue {
  user: Employee | null
  loading: boolean
  login: (email: string, password: string) => Promise<Employee>
  loginAs: (role: Role) => void
  logout: () => void
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<Employee | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const id = readCookie(SESSION_COOKIE)
    if (id) {
      const found = employees.find((e) => e.id === id)
      if (found) setUser(found)
    }
    setLoading(false)
  }, [])

  const login = React.useCallback(
    (email: string, password: string) =>
      new Promise<Employee>((resolve, reject) => {
        // Simulated latency so loading states are visible.
        setTimeout(() => {
          const found = employees.find(
            (e) => e.email.toLowerCase() === email.trim().toLowerCase(),
          )
          if (!found) {
            reject(new Error("No account found for that email address."))
            return
          }
          if (password !== DEMO_PASSWORD) {
            reject(new Error("Incorrect password. Please try again."))
            return
          }
          writeCookie(SESSION_COOKIE, found.id)
          setUser(found)
          resolve(found)
        }, 650)
      }),
    [],
  )

  const loginAs = React.useCallback((role: Role) => {
    const found = employees.find((e) => e.role === role)
    if (found) {
      writeCookie(SESSION_COOKIE, found.id)
      setUser(found)
    }
  }, [])

  const logout = React.useCallback(() => {
    clearCookie(SESSION_COOKIE)
    setUser(null)
  }, [])

  const value = React.useMemo(
    () => ({ user, loading, login, loginAs, logout }),
    [user, loading, login, loginAs, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
