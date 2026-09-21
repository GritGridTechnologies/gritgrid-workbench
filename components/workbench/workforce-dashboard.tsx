"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileBox,
  Gauge,
  Menu,
  Play,
  RefreshCw,
  ShieldCheck,
  Users,
  X,
  XCircle,
  Zap,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { AiApiError, aiClient } from "@/lib/ai/client"
import type {
  AgentSummary,
  ArtifactRecord,
  ApprovalRecord,
  CEOTaskResponse,
  ProviderRecord,
  TaskRecord,
  WorkforceMetrics,
  WorkforceStatus,
} from "@/lib/ai/types"
import { cn } from "@/lib/utils"

type View = "Dashboard" | "Agents" | "Tasks" | "Approvals" | "Artifacts" | "Providers"
const views: { label: View; icon: typeof Gauge }[] = [
  { label: "Dashboard", icon: Gauge },
  { label: "Agents", icon: Users },
  { label: "Tasks", icon: ClipboardList },
  { label: "Approvals", icon: ShieldCheck },
  { label: "Artifacts", icon: FileBox },
  { label: "Providers", icon: Zap },
]
const taskStatuses = ["all", "running", "pending", "waiting", "waiting_for_approval", "completed", "failed"]

type Availability = "available" | "unavailable" | "unknown"

function agentAvailability(agent: AgentSummary): Availability {
  const value = agent.availability ?? agent.status ?? (typeof agent.available === "boolean" ? (agent.available ? "available" : "unavailable") : undefined)
  if (!value) return "unknown"
  if (/^(available|online|ready)$/i.test(value)) return "available"
  if (/^(unavailable|offline|disabled)$/i.test(value)) return "unavailable"
  return "unknown"
}

function labelize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}
function formatDate(value?: string | null) {
  if (!value) return "Awaiting timestamp"
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date)
}
function statusTone(value: string) {
  if (/completed|approved|available|online/i.test(value)) return "statusBadge-success"
  if (/running|pending|waiting/i.test(value)) return "statusBadge-warning"
  if (/failed|rejected|cancelled|unavailable|offline/i.test(value)) return "statusBadge-danger"
  return ""
}
function StatusBadge({ value }: { value: string }) {
  return <span className={cn("statusBadge", statusTone(value))}><span className="statusBadgeDot" />{labelize(value)}</span>
}
function errorMessage(error: unknown, fallback: string) {
  if (!(error instanceof AiApiError)) return fallback
  if (error.status === 401) return "Authentication required to access this data."
  if (error.status === 403) return "You are not authorized to access this data."
  if (error.status === 404) return "This backend operation is unavailable."
  if (error.status === 409) return "The backend rejected this state transition."
  if (error.status === 422) return "The backend rejected the request data."
  if (error.status >= 500) return "The backend encountered an error."
  return fallback
}
function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="emptyState"><Activity className="size-5" /><strong>{title}</strong><p>{detail}</p></div>
}
export function WorkforceDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [view, setView] = React.useState<View>("Dashboard")
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [agents, setAgents] = React.useState<AgentSummary[]>([])
  const [tasks, setTasks] = React.useState<TaskRecord[]>([])
  const [approvals, setApprovals] = React.useState<ApprovalRecord[]>([])
  const [allApprovals, setAllApprovals] = React.useState<ApprovalRecord[]>([])
  const [artifacts, setArtifacts] = React.useState<ArtifactRecord[]>([])
  const [providers, setProviders] = React.useState<ProviderRecord[]>([])
  const [status, setStatus] = React.useState<WorkforceStatus | null>(null)
  const [metrics, setMetrics] = React.useState<WorkforceMetrics | null>(null)
  const [taskFilter, setTaskFilter] = React.useState("all")
  const [query, setQuery] = React.useState("")
  const [goal, setGoal] = React.useState("")
  const [ceoResult, setCeoResult] = React.useState<CEOTaskResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [busyId, setBusyId] = React.useState<string | number | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [resourceErrors, setResourceErrors] = React.useState({ agents: false, tasks: false, providers: false })

  const loadData = React.useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true)
    setError(null)
    const results = await Promise.allSettled([
      aiClient.getAgents(), aiClient.getTasks(), aiClient.getApprovals("pending"), aiClient.getApprovals("approved"), aiClient.getApprovals("rejected"),
      aiClient.getArtifacts(), aiClient.getProviders(), aiClient.getWorkforceStatus(),
    ])
    const [agentsResult, tasksResult, approvalsResult, approvedResult, rejectedResult, artifactsResult, providersResult, statusResult] = results
    setResourceErrors({ agents: agentsResult.status === "rejected", tasks: tasksResult.status === "rejected", providers: providersResult.status === "rejected" })
    if (agentsResult.status === "fulfilled") setAgents(agentsResult.value)
    if (tasksResult.status === "fulfilled") setTasks(tasksResult.value)
    if (approvalsResult.status === "fulfilled") setApprovals(approvalsResult.value)
    if (approvedResult.status === "fulfilled" && rejectedResult.status === "fulfilled") setAllApprovals([...(approvalsResult.status === "fulfilled" ? approvalsResult.value : []), ...approvedResult.value, ...rejectedResult.value])
    if (artifactsResult.status === "fulfilled") setArtifacts(artifactsResult.value)
    if (providersResult.status === "fulfilled") setProviders(providersResult.value.providers)
    if (statusResult.status === "fulfilled") setStatus(statusResult.value)
    if (results.every((result) => result.status === "rejected")) setError("Backend unavailable. Check the API connection.")
    setLoading(false)
    setRefreshing(false)
  }, [])

  function openTask(task: TaskRecord) {
    router.push(`/tasks/${encodeURIComponent(task.task_id)}`)
  }

  React.useEffect(() => {
    void loadData()
    const interval = window.setInterval(() => void loadData(true), 20_000)
    return () => window.clearInterval(interval)
  }, [loadData])

  async function mutate(id: string | number, action: () => Promise<unknown>, message: string) {
    if (!user) { setNotice("Sign in to change workforce state."); return }
    setBusyId(id)
    try { await action(); setNotice(message); await loadData(true) }
    catch (error) { setNotice(errorMessage(error, "The backend could not complete that action.")) }
    finally { setBusyId(null) }
  }
  async function createTask(event: React.FormEvent) {
    event.preventDefault()
    if (!goal.trim() || !user) { setNotice(user ? "Enter a goal first." : "Sign in to create an AI task."); return }
    setBusyId("ceo")
    try { const result = await aiClient.createCeoTask({ goal: goal.trim() }); setCeoResult(result); setGoal(""); setNotice("AI task created by the CEO backend."); await loadData(true) }
    catch (error) { setNotice(errorMessage(error, "AI task could not be created.")) }
    finally { setBusyId(null) }
  }
  const filteredTasks = tasks.filter((task) => {
    const text = `${task.task_id} ${task.title} ${task.assigned_agent}`.toLowerCase()
    return (taskFilter === "all" || task.status === taskFilter) && (!query.trim() || text.includes(query.toLowerCase()))
  })
  const title = view === "Dashboard" ? "Workforce overview" : view

  return <main className="workbenchShell">
    <aside className={cn("workbenchSidebar", menuOpen && "workbenchSidebarOpen")}>
      <div className="workbenchBrand"><div className="workbenchLogo">G</div><div><strong>GritGrid</strong><span>WORKBENCH</span></div></div>
      <div className="sidebarKicker">AI WORKFORCE</div>
      <nav className="workforceNav" aria-label="AI Workforce">{views.map(({ label, icon: Icon }) => <button key={label} className={cn("workforceNavItem", view === label && "workforceNavItemActive")} onClick={() => { setView(label); setMenuOpen(false) }}><Icon className="size-4" /><span>{label}</span>{label === "Approvals" && approvals.length > 0 && <b>{approvals.length}</b>}</button>)}</nav>
      <div className="sidebarFoot"><div className="secureLine"><ShieldCheck className="size-3.5" /> Server-side AI gateway</div><div className="userLine"><div className="userAvatar">{user ? user.name.slice(0, 2).toUpperCase() : "--"}</div><div><strong>{user?.name ?? "Guest session"}</strong><small>{user ? `${user.role} access` : "Read-only until sign in"}</small></div></div></div>
    </aside>
    {menuOpen && <button className="workbenchOverlay" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <section className="workbenchContent"><header className="workbenchTopbar"><button className="mobileMenuButton" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu className="size-5" /></button><div><span className="workbenchEyebrow">AI WORKFORCE / CONTROL</span><h1>{title}</h1></div><div className="topbarActions"><div className={cn("systemStatus", error && "systemStatusWarn")}><span />{error ? "Backend attention" : "Systems ready"}</div><button className="profileButton" title={user ? "Sign out" : "Sign in required"} onClick={() => user && void logout()}>{user ? user.name.slice(0, 2).toUpperCase() : "GG"}</button></div></header>
      <div className="workbenchPage"><div className="pageIntro"><div><h2>{title}</h2><p>Observe persisted workforce state and send consequential actions through the backend.</p></div><button className="outlineButton" onClick={() => void loadData(true)} disabled={refreshing}><RefreshCw className={cn("size-4", refreshing && "spin")} /> Refresh</button></div>
        {notice && <div className="actionNotice" role="status"><CheckCircle2 className="size-4" /><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice(null)}><X className="size-4" /></button></div>}
        {error && <div className="errorBanner" role="alert"><XCircle className="size-4" /><div><strong>Unable to load some workforce data.</strong><span>{error}</span></div></div>}
        {view === "Dashboard" && <Dashboard status={status} metrics={metrics} agents={agents} agentsError={resourceErrors.agents} tasks={tasks} approvals={approvals} artifacts={artifacts} providers={providers} providersError={resourceErrors.providers} loading={loading} onCreate={createTask} goal={goal} setGoal={setGoal} busy={busyId === "ceo"} result={ceoResult} onNavigate={setView} />}
        {view === "Agents" && <Agents agents={agents} loading={loading} error={resourceErrors.agents} />}
        {view === "Tasks" && <Tasks tasks={filteredTasks} loading={loading} error={resourceErrors.tasks} filter={taskFilter} setFilter={setTaskFilter} query={query} setQuery={setQuery} onSelect={openTask} onControl={(task, action) => void mutate(task.task_id, action === "execute" ? () => aiClient.executeTask(task.task_id) : () => aiClient.cancelTask(task.task_id), `Task ${action} request sent.`)} busyId={busyId} approvals={allApprovals} />}
        {view === "Approvals" && <Approvals approvals={approvals} loading={loading} onDecision={(approval, decision) => void mutate(approval.id, () => aiClient.decideApproval(approval.id, decision), `Approval ${decision}d.`)} busyId={busyId} />}
        {view === "Artifacts" && <Artifacts artifacts={artifacts} loading={loading} />}
        {view === "Providers" && <Providers providers={providers} loading={loading} error={resourceErrors.providers} />}
        <footer className="workbenchFooter">GritGrid Technologies · AI Workforce Control Center · <span>Server-side API gateway</span></footer>
      </div>
    </section>
  </main>
}

function Dashboard({ status, metrics, agents, agentsError, tasks, approvals, artifacts, providers, providersError, loading, onCreate, goal, setGoal, busy, result, onNavigate }: { status: WorkforceStatus | null; metrics: WorkforceMetrics | null; agents: AgentSummary[]; agentsError: boolean; tasks: TaskRecord[]; approvals: ApprovalRecord[]; artifacts: ArtifactRecord[]; providers: ProviderRecord[]; providersError: boolean; loading: boolean; onCreate: (event: React.FormEvent) => void; goal: string; setGoal: (value: string) => void; busy: boolean; result: CEOTaskResponse | null; onNavigate: (view: View) => void }) {
  const value = (metric: keyof WorkforceMetrics, fallback?: number) => loading ? "..." : metrics?.[metric] ?? fallback ?? "—"
  const catalogTotal = agentsError ? "—" : agents.length
  const catalogAvailable = agentsError ? "—" : agents.filter((agent) => agentAvailability(agent) === "available").length
  const providerCount = providers.length
  const cards = [["Total agents", loading ? "..." : catalogTotal, Users], ["Available agents", loading ? "..." : catalogAvailable, CheckCircle2], ["Running tasks", value("running_tasks", status?.running_tasks), ClipboardList], ["Pending approvals", value("pending_approvals", approvals.length), ShieldCheck], ["Completed tasks", value("completed_tasks", status?.completed_tasks), CheckCircle2], ["Failed tasks", value("failed_tasks", status?.failed_tasks), XCircle], ["Artifacts", value("artifact_count", artifacts.length), FileBox], ["Providers reported", loading ? "..." : providersError ? "—" : providerCount, Zap]] as const
  return <><section className="overviewHero"><div><span className="workbenchEyebrow cyanEyebrow">GRITGRID AI WORKFORCE</span><h3>Human judgment, <em>machine momentum.</em></h3><p>Track the agents, tasks, approvals, and artifacts that the backend is coordinating right now.</p></div><div className="heroSignal"><div className="signalCore"><Activity className="size-6" /></div><span>Backend state</span><small>{status?.status ? labelize(status.status) : "Awaiting data"}</small></div></section><div className="metricGrid">{cards.map(([label, count, Icon]) => <article className="metricCard" key={label}><div className="metricTop"><span>{label}</span><Icon className="size-4" /></div><strong>{count}</strong><small>Reported by backend</small></article>)}</div><div className="contentGrid"><section className="surfacePanel commandPanel"><span className="workbenchEyebrow">CEO TASK CREATION</span><h3>Create AI Task</h3><p>Describe a goal. The backend decides the plan, agents, dependencies, and approvals.</p><form onSubmit={onCreate}><textarea aria-label="AI task goal" value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Create a campaign proposal for the Hyderabad student market." rows={4} /><button className="primaryButton" disabled={busy || !goal.trim()}><Play className="size-4" />{busy ? "Creating task" : "Create AI Task"}</button></form>{result && <pre className="jsonBlock">{JSON.stringify(result, null, 2)}</pre>}</section><section className="surfacePanel"><div className="panelHeader"><div><span className="workbenchEyebrow">CONTROL SURFACES</span><h3>Open a view</h3></div></div><div className="quickActions">{(["Agents", "Tasks", "Approvals", "Artifacts", "Providers"] as View[]).map((item) => <button key={item} onClick={() => onNavigate(item)}><ChevronRight className="size-4" /><span><strong>{item}</strong><small>Inspect current backend data</small></span></button>)}</div></section></div></>
}

function Agents({ agents, loading, error }: { agents: AgentSummary[]; loading: boolean; error: boolean }) { return <section className="agentGrid">{loading ? <div className="loadingBox">Loading agent registry...</div> : error ? <Empty title="Unable to load agents." detail="Agent data is unavailable from the backend." /> : agents.length ? agents.map((agent) => { const availability = agentAvailability(agent); return <article className="agentCard" key={agent.id}><div className="agentCardTop"><span className="agentMark">{(agent.display_name ?? agent.name).slice(0, 2).toUpperCase()}</span><StatusBadge value={availability} /></div><strong>{agent.display_name ?? labelize(agent.name)}</strong><small>{agent.description ?? agent.role ?? "Registered workforce agent"}</small><div className="tagList">{agent.capabilities?.length ? agent.capabilities.map((item, index) => <span key={`${item}-${index}`}>{labelize(item)}</span>) : <span>Capabilities unavailable</span>}</div></article> }) : <Empty title="No agents are currently registered." detail="The backend returned an empty agent catalog." />}</section> }

function Tasks({ tasks, loading, error, filter, setFilter, query, setQuery, onSelect, onControl, busyId, approvals }: { tasks: TaskRecord[]; loading: boolean; error: boolean; filter: string; setFilter: (value: string) => void; query: string; setQuery: (value: string) => void; onSelect: (task: TaskRecord) => void; onControl: (task: TaskRecord, action: "execute" | "cancel") => void; busyId: string | number | null; approvals: ApprovalRecord[] }) { return <section className="surfacePanel tablePanel"><div className="panelHeader"><div><span className="workbenchEyebrow">TASK MONITOR</span><h3>{error ? "Task data unavailable" : tasks.length ? `${tasks.length} loaded tasks` : "No AI tasks yet."}</h3></div></div><div className="filterRow"><input className="taskSearch" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search task, ID, or agent" aria-label="Search tasks" />{taskStatuses.map((value) => <button key={value} className={cn("filterButton", filter === value && "filterButtonActive")} onClick={() => setFilter(value)}>{labelize(value)}</button>)}</div>{loading ? <div className="loadingBox">Loading tasks...</div> : error ? <Empty title="Unable to load tasks." detail="Task data is unavailable from the backend." /> : tasks.length ? <div className="dataTableWrap"><table className="dataTable"><thead><tr><th>Task</th><th>Agent</th><th>Status</th><th>Approval</th><th>Updated</th><th /></tr></thead><tbody>{tasks.map((task) => { const taskApprovals = approvals.filter((approval) => approval.task_id === task.id); const approval = taskApprovals[0]; return <tr key={task.id}><td><button className="tableLink" onClick={() => onSelect(task)}><strong>{task.task_id}</strong><span>{task.title}</span></button></td><td>{labelize(task.assigned_agent)}</td><td><StatusBadge value={task.status || "unknown"} /></td><td>{approval ? <StatusBadge value={approval.status} /> : task.status === "waiting_for_approval" ? <StatusBadge value="pending" /> : "Not required"}</td><td>{formatDate(task.completed_at ?? task.started_at ?? task.created_at)}</td><td><div className="tableActions"><button className="iconButton" aria-label={`View task ${task.task_id}`} title="Open task details" onClick={() => onSelect(task)}><ChevronRight className="size-4" /></button>{task.status === "pending" && <button className="iconButton" aria-label={`Execute task ${task.task_id}`} title="Execute task" disabled={busyId === task.task_id} onClick={() => onControl(task, "execute")}><Play className="size-4" /></button>}{["pending", "blocked"].includes(task.status) && <button className="iconButton" aria-label={`Cancel task ${task.task_id}`} title="Cancel task" disabled={busyId === task.task_id} onClick={() => onControl(task, "cancel")}><X className="size-4" /></button>}</div></td></tr> })}</tbody></table></div> : <Empty title="No AI tasks yet." detail="Create an AI task from the Dashboard to start a backend workflow." />}</section> }

export function TaskDetail({ task, loading, error, onClose }: { task: TaskRecord; loading?: boolean; error?: string | null; onClose: () => void }) { const approval = task.approvals?.[0]; return <aside className="taskDetail surfacePanel"><button className="closeDetail" onClick={onClose} aria-label="Back to tasks"><X /></button><span className="workbenchEyebrow">TASK DETAIL</span><h3>{task.title}</h3><StatusBadge value={task.status || "unknown"} /><dl className="detailList"><div><dt>Task ID</dt><dd>{task.task_id}</dd></div><div><dt>Agent</dt><dd>{labelize(task.assigned_agent)}</dd></div><div><dt>Priority</dt><dd>{labelize(task.priority)}</dd></div><div><dt>Created</dt><dd>{formatDate(task.created_at)}</dd></div><div><dt>Updated</dt><dd>{formatDate(task.completed_at ?? task.started_at ?? task.created_at)}</dd></div><div><dt>Approval</dt><dd>{approval ? labelize(approval.status) : "Not required"}</dd></div><div><dt>Dependencies</dt><dd>{task.depends_on?.length ? task.depends_on.join(" → ") : "None reported"}</dd></div><div><dt>Artifacts</dt><dd>{task.artifacts?.length ?? 0}</dd></div></dl><section className="detailSection"><h4>Description</h4><p>{task.description || "No description provided."}</p></section><section className="detailSection"><h4>Input</h4>{Object.keys(task.input_data ?? {}).length ? <pre className="jsonBlock">{JSON.stringify(task.input_data, null, 2)}</pre> : <p>No input data provided.</p>}</section>{loading && <div className="loadingBox">Loading full task details...</div>}{error && <div className="detailError">{error}</div>}{task.error && <div className="detailError">{task.error}</div>}{task.artifacts?.length ? <div className="detailArtifacts">{task.artifacts.map((artifact) => <span key={artifact.artifact_id}>{artifact.artifact_type}</span>)}</div> : <section className="detailSection"><h4>Artifacts</h4><p>No artifacts reported.</p></section>}{task.output_data ? <section className="detailSection"><h4>Output</h4><pre className="jsonBlock">{JSON.stringify(task.output_data, null, 2)}</pre></section> : <section className="detailSection"><h4>Output</h4><p>No output reported.</p></section>}</aside> }

function Approvals({ approvals, loading, onDecision, busyId }: { approvals: ApprovalRecord[]; loading: boolean; onDecision: (approval: ApprovalRecord, decision: "approve" | "reject") => void; busyId: string | number | null }) { return <section className="surfacePanel"><div className="panelHeader"><div><span className="workbenchEyebrow">HUMAN GATE</span><h3>Approval center</h3></div><StatusBadge value={`${approvals.length} pending`} /></div>{loading ? <div className="loadingBox">Loading approvals...</div> : approvals.length ? <div className="approvalList">{approvals.map((approval) => <article className="approvalItem" key={approval.id}><div className="approvalIcon"><ShieldCheck className="size-5" /></div><div className="approvalBody"><div className="approvalTop"><strong>{labelize(approval.action)}</strong><span>#{approval.id}</span></div><p>{approval.description}</p><small>Task {approval.task_id ?? "not reported"} · {formatDate(approval.created_at)}</small></div><div className="approvalActions"><button className="approveButton" disabled={busyId === approval.id} onClick={() => onDecision(approval, "approve")}><Check className="size-4" />Approve</button><button className="rejectButton" disabled={busyId === approval.id} onClick={() => onDecision(approval, "reject")}><X className="size-4" />Reject</button></div></article>)}</div> : <Empty title="No approvals require your attention." detail="The backend has no pending approval decisions." />}</section> }

function Artifacts({ artifacts, loading }: { artifacts: ArtifactRecord[]; loading: boolean }) { return <section className="artifactGrid">{loading ? <div className="loadingBox">Loading artifacts...</div> : artifacts.length ? artifacts.map((artifact) => <article className="surfacePanel artifactCard" key={artifact.artifact_id}><div className="artifactTop"><FileBox className="size-5" /><StatusBadge value={artifact.status ?? "reported"} /></div><strong>{labelize(artifact.artifact_type)}</strong><small>Artifact {artifact.artifact_id} · Task {artifact.task_id ?? "not reported"}</small><p>{artifact.provider ?? "Provider not reported"}</p>{artifact.location && /^https?:\/\/[^\s]+$/i.test(artifact.location) && /image/i.test(artifact.artifact_type) ? <img src={artifact.location} alt={`Artifact ${artifact.artifact_id}`} /> : <code>{artifact.location ?? "Location unavailable"}</code>}</article>) : <Empty title="No artifacts have been created yet." detail="Artifacts will appear when backend tasks produce them." />}</section> }

function Providers({ providers, loading, error }: { providers: ProviderRecord[]; loading: boolean; error: boolean }) { return <section className="providerGrid">{loading ? <div className="loadingBox">Loading providers...</div> : error ? <Empty title="Unable to load providers." detail="Provider data is unavailable from the backend." /> : providers.length ? providers.map((provider) => <article className="surfacePanel providerCard" key={provider.provider}><div className="artifactTop"><strong>{provider.provider}</strong><StatusBadge value={provider.status ?? "unknown"} /></div><small>Provider status reported by backend</small><div className="tagList">{(provider.capabilities ?? []).map((item) => <span key={item}>{labelize(item)}</span>)}</div></article>) : <Empty title="No provider data returned." detail="The backend returned no provider records." />}</section> }
