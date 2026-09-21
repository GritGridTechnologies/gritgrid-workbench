export interface AgentSummary {
  id: string
  name: string
  display_name?: string
  description?: string
  status?: string
  availability?: string
  available?: boolean
  role?: string
  capabilities?: string[]
  permissions?: string[]
  required_model_capabilities?: string[]
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

export interface WorkforceMetrics {
  total_agents?: number
  available_agents?: number
  running_tasks?: number
  pending_tasks?: number
  waiting_tasks?: number
  pending_approvals?: number
  completed_tasks?: number
  failed_tasks?: number
  artifact_count?: number
  available_providers?: number
  [key: string]: number | undefined
}

export interface ProviderRecord {
  provider: string
  capabilities?: string[]
  status?: string
  error?: string | null
}

export interface ProviderCatalog {
  providers: ProviderRecord[]
  routing: Record<string, string | null>
}

export interface ArtifactRecord {
  id: number
  artifact_id: string
  artifact_type: string
  task_id: string | number | null
  provider: string | null
  metadata: Record<string, unknown>
  location: string | null
  status?: string | null
  created_at?: string | null
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
  approvals?: ApprovalRecord[]
  artifacts?: ArtifactRecord[]
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
  approved_by?: string | null
  resolved_at?: string | null
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

export interface CEOTaskRequest {
  goal: string
}

export interface CEOTaskResponse {
  task?: TaskRecord
  tasks?: TaskRecord[]
  plan?: Record<string, unknown> | null
  [key: string]: unknown
}