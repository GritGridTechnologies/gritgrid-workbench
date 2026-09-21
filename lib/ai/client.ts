import type {
  AgentSummary,
  AiHealth,
  ArtifactRecord,
  ApprovalDecision,
  ApprovalRecord,
  EventRecord,
  MemoryCreateInput,
  MemoryRecord,
  MemoryUpdateInput,
  ObjectiveResult,
  ProviderCatalog,
  ProviderRecord,
  RunRecord,
  TaskCreateInput,
  TaskRecord,
  CEOTaskRequest,
  CEOTaskResponse,
  WorkforceMetrics,
  WorkforceStatus,
} from "./types"

const REQUEST_TIMEOUT_MS = 12_000

export class AiApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = "AiApiError"
  }
}

function apiUrl() {
  const value = process.env.GRITGRID_AI_API_URL?.trim()
  if (!value) throw new Error("GRITGRID_AI_API_URL is not configured")
  return value.replace(/\/$/, "")
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const headers = new Headers(init.headers)
  headers.set("Accept", "application/json")
  if (init.body) headers.set("Content-Type", "application/json")
  const token = process.env.GRITGRID_AI_API_TOKEN?.trim()
  if (token) headers.set("Authorization", `Bearer ${token}`)

  try {
    const response = await fetch(`/api/ai${path}`, {
      ...init,
      headers,
      cache: "no-store",
      signal: controller.signal,
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      const detail =
        payload && typeof payload === "object" && "detail" in payload
          ? String(payload.detail)
          : `AI backend returned ${response.status}`
      throw new AiApiError(detail, response.status)
    }
    return payload as T
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("AI Workforce backend timed out")
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export const aiClient = {
  getHealth: () => request<AiHealth>("/health"),
  getAgents: async () => {
    const { agents } = await request<{ agents: AgentSummary[] }>("/agents")
    return Promise.all(
      agents.map(async (agent) => {
        try {
          const detail = await request<Omit<AgentSummary, "available">>(
            `/agents/${encodeURIComponent(agent.name)}`,
          )
          return {
            ...agent,
            ...detail,
            capabilities: detail.capabilities?.length ? detail.capabilities : agent.capabilities,
          }
        } catch {
          return agent
        }
      }),
    )
  },
  getWorkforceStatus: () => request<WorkforceStatus>("/workforce/status"),
  getWorkforceMetrics: () => request<WorkforceMetrics>("/workforce/metrics"),
  getArtifacts: () => request<ArtifactRecord[]>("/artifacts"),
  getProviders: () => request<ProviderCatalog>("/providers"),
  createTask: (input: TaskCreateInput) =>
    request<TaskRecord>("/tasks", { method: "POST", body: JSON.stringify(input) }),
  getTasks: (status?: string) =>
    request<TaskRecord[]>(status ? `/tasks?status=${encodeURIComponent(status)}` : "/tasks"),
  getTask: (taskId: string | number) => request<TaskRecord>(`/tasks/${encodeURIComponent(taskId)}`),
  executeTask: (taskId: string | number) =>
    request<TaskRecord>(`/tasks/${encodeURIComponent(taskId)}/execute`, { method: "POST" }),
  cancelTask: (taskId: string | number) =>
    request<TaskRecord>(`/tasks/${encodeURIComponent(taskId)}/cancel`, { method: "POST" }),
  getRuns: (limit = 100) => request<RunRecord[]>(`/runs?limit=${limit}`),
  getEvents: (limit = 100) => request<EventRecord[]>(`/events?limit=${limit}`),
  getMemory: (query?: string) =>
    request<MemoryRecord[]>(query ? `/memory?query=${encodeURIComponent(query)}` : "/memory"),
  createMemory: (input: MemoryCreateInput) =>
    request<MemoryRecord>("/memory", { method: "POST", body: JSON.stringify(input) }),
  updateMemory: (memoryId: number, input: MemoryUpdateInput) =>
    request<MemoryRecord>(`/memory/${memoryId}`, { method: "PUT", body: JSON.stringify(input) }),
  deleteMemory: (memoryId: number) =>
    request<{ deleted: boolean; id: number }>(`/memory/${memoryId}`, { method: "DELETE" }),
  getApprovals: (status?: "pending" | "approved" | "rejected") =>
    request<ApprovalRecord[]>(status ? `/approvals?status=${status}` : "/approvals"),
  decideApproval: (approvalId: number, decision: "approve" | "reject") =>
    request<ApprovalDecision>(`/approvals/${approvalId}/${decision}`, { method: "POST" }),
  runObjective: (objective: string) =>
    request<ObjectiveResult>("/orchestrator/run", {
      method: "POST",
      body: JSON.stringify({ objective }),
    }),
  createCeoTask: (input: CEOTaskRequest) =>
    request<CEOTaskResponse>("/agents/ceo/tasks", {
      method: "POST",
      body: JSON.stringify(input),
    }),
}

export async function proxyAiRequest(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const headers = new Headers(init.headers)
  headers.set("Accept", "application/json")
  if (init.body) headers.set("Content-Type", "application/json")
  const token = process.env.GRITGRID_AI_API_TOKEN?.trim()
  if (token) headers.set("Authorization", `Bearer ${token}`)

  try {
    return await fetch(`${apiUrl()}${path}`, {
      ...init,
      headers,
      cache: "no-store",
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}