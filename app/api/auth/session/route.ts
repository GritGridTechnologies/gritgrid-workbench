import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStoreHeaders = { "Cache-Control": "private, no-store, max-age=0" }

export async function GET() {
  try {
    const session = await getSession()
    return NextResponse.json(session ?? { user: null }, { headers: noStoreHeaders })
  } catch {
    return NextResponse.json(
      { detail: "Authentication service is unavailable" },
      { status: 503, headers: noStoreHeaders },
    )
  }
}