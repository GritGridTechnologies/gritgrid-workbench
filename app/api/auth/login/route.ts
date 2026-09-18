import { NextResponse } from "next/server"
import { authenticate } from "@/lib/auth-server"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStoreHeaders = { "Cache-Control": "private, no-store, max-age=0" }

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email : ""
    const password = typeof body.password === "string" ? body.password : ""
    if (!email || !password) return NextResponse.json({ detail: "Email and password are required" }, { status: 400, headers: noStoreHeaders })
    const session = await authenticate(email, password)
    return NextResponse.json(session, { headers: noStoreHeaders })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sign in"
    const status = message === "Invalid email or password" ? 401 : 503
    return NextResponse.json(
      { detail: status === 401 ? message : "Authentication service is unavailable" },
      { status, headers: noStoreHeaders },
    )
  }
}