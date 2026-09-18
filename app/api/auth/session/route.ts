import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"

export async function GET() {
  try {
    const session = await getSession()
    return NextResponse.json(session ?? { user: null })
  } catch {
    return NextResponse.json({ detail: "Authentication service is unavailable" }, { status: 503 })
  }
}