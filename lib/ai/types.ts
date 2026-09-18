export interface AgentSummary {
  name: string
  available: boolean
  role?: string
  capabilities?: string[]
}

export interface WorkforceStatus {
  status: string
  total_agents: number
  active_agents: number
  pending_tasks: number
  running_tasks: number
  completed_tasks: number
  failed_tasks: number
}

export interface TaskRecord {
  id: number
  task_id: string
  title: string
  description: string
  assigned_agent: string
  priority: string
  status: string
  input_data: Record<string, unknown>
  output_data: Record<string, unknown> | null
  error: string | null
  workflow_id: string | null
  depends_on: string[]
  created_at: string
  started_at: string | null
  completed_at: string | null
  claimed_by: string | null
  lease_expires_at: string | null
}

export interface RunRecord {
  id: number
  task_id: number | null
  agent_name: string
  model: string | null
  status: string
  result: Record<string, unknown> | null
  error: string | null
  started_at: string
  completed_at: string | null
}

export interface EventRecord {
  id: number
  event_type: string
  source_agent: string | null
  target_agent: string | null
  payload: Record<string, unknown>
  created_at: string
}

export interface ApprovalRecord {
  id: number
  task_id: number | null
  action: string
  description: string
  status: string
  requested_by: string
  created_at: string
}

export interface MemoryRecord {
  id: number
  memory_key: string
  memory_type: string
  content: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at?: string
}

export interface TaskCreateInput {
  title: string
  description: string
  assigned_agent: string
  priority: string
  input_data?: Record<string, unknown>
}

export interface ObjectiveResult {
  [key: string]: unknown
}

export interface MemoryCreateInput {
  memory_key: string
  content: string
  memory_type: string
  metadata?: Record<string, unknown>
}

export interface MemoryUpdateInput {
  content: string
  metadata?: Record<string, unknown>
}

export interface ApprovalDecision {
  id: number
  status: string
  resolved_at?: string
}

export interface AiHealth {
  api: string
  status: string
  database: string
  openai: string
  [key: string]: string
}