import { NextResponse } from "next/server"
import { destroySession } from "@/lib/auth-server"

export async function POST() {
  try {
    await destroySession()
  } catch {
    return NextResponse.json({ detail: "Unable to complete sign out" }, { status: 503 })
  }
  return NextResponse.json({ ok: true })
}