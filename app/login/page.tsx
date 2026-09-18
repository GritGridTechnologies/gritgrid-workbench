"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react"
import { useAuth } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, login } = useAuth()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!loading && user) router.replace("/")
  }, [loading, router, user])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email, password)
      router.replace("/")
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="loginShell">
      <section className="loginPanel">
        <div className="loginBrand"><div className="workbenchLogo">G</div><div><strong>GritGrid</strong><span>WORKBENCH</span></div></div>
        <div className="loginIcon"><LockKeyhole className="size-5" /></div>
        <span className="workbenchEyebrow">INTERNAL ACCESS</span>
        <h1>Sign in to the Workbench</h1>
        <p className="loginIntro">Use your GritGrid employee account to access the AI Workforce control center.</p>
        {error && <div className="loginError" role="alert">{error}</div>}
        <form onSubmit={submit} className="loginForm">
          <label>Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button className="primaryButton loginButton" disabled={busy}>{busy ? <LoaderCircle className="size-4 spin" /> : <ArrowRight className="size-4" />}{busy ? "Signing in" : "Sign in"}</button>
        </form>
        <small className="loginSecurity">Sessions are encrypted, HTTP-only, and expire automatically.</small>
      </section>
    </main>
  )
}