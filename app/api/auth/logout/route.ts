import { NextResponse } from "next/server"
import { destroySession } from "@/lib/auth-server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST() {
  try {
    await destroySession()
  } catch {
    return NextResponse.json(
      { detail: "Unable to complete sign out" },
      { status: 503, headers: { "Cache-Control": "private, no-store, max-age=0" } },
    )
  }
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  )
}