import { NextRequest, NextResponse } from "next/server"
import { proxyAiRequest } from "@/lib/ai/client"

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
    const session = request.cookies.get("gg_session")?.value
    if (!session) {
      return NextResponse.json(
        { detail: "Sign in to the Workbench before changing workforce data" },
        { status: 401 },
      )
    }
  }

  try {
    const body = request.method === "GET" ? undefined : await request.text()
    const response = await proxyAiRequest(`/${path}${request.nextUrl.search}`, {
      method: request.method,
      body: body || undefined,
    })
    const payload = await response.text()
    return new NextResponse(payload, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
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