import { NextRequest, NextResponse } from "next/server"
import { proxyAiRequest } from "@/lib/ai/client"
import { AuthError, requireRole } from "@/lib/auth-server"

const ALLOWED_PATHS = [
  /^health$/,
  /^agents(?:\/[^/]+)?$/,
  /^workforce\/status$/,
  /^tasks(?:\/[^/]+)?(?:\/execute|\/cancel)?$/,
  /^orchestrator\/run$/,
  /^memory(?:\/\d+)?$/,
  /^approvals(?:\/\d+\/(?:approve|reject))?$/,
  /^events$/,
  /^runs$/,
]

function isAllowed(path: string) {
  return ALLOWED_PATHS.some((pattern) => pattern.test(path))
}

async function handle(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params
  const path = segments.map((segment) => encodeURIComponent(segment)).join("/")
  if (!isAllowed(path)) {
    return NextResponse.json({ detail: "AI endpoint is not available" }, { status: 404 })
  }

  if (request.method !== "GET") {
    try {
      await requireRole(["OWNER", "MANAGER"])
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json({ detail: error.message }, { status: error.status })
      }
      return NextResponse.json({ detail: "Authentication service is unavailable" }, { status: 503 })
    }
  }

  try {
    const body = request.method === "GET" ? undefined : await request.text()
    const response = await proxyAiRequest(`/${path}${request.nextUrl.search}`, {
      method: request.method,
      body: body || undefined,
    })
    const payload = await response.text()
    if (response.status === 401) {
      return NextResponse.json(
        { detail: "AI backend authentication failed; check GRITGRID_AI_API_TOKEN" },
        { status: 502, headers: { "Cache-Control": "private, no-store, max-age=0" } },
      )
    }
    return new NextResponse(payload, {
      status: response.status,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Type": response.headers.get("Content-Type") ?? "application/json",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI Workforce backend is unavailable"
    return NextResponse.json({ detail: message }, { status: 503 })
  }
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const DELETE = handle