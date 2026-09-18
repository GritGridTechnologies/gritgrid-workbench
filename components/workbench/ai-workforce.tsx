"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Command,
  Database,
  Layers3,
  Menu,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  XCircle,
  Zap,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import type {
  AgentSummary,
  ApprovalRecord,
  EventRecord,
  MemoryRecord,
  RunRecord,
  TaskRecord,
  WorkforceStatus,
} from "@/lib/ai/types"

type Section =
  | "Overview"
  | "Agents"
  | "Command Center"
  | "Tasks"
  | "Runs / Activity"
  | "Approvals"
  | "Company Brain"
  | "Analytics"

const navigation: { label: Section; icon: typeof Activity }[] = [
  { label: "Overview", icon: Layers3 },
  { label: "Agents", icon: Users },
  { label: "Command Center", icon: Command },
  { label: "Tasks", icon: ClipboardList },
  { label: "Runs / Activity", icon: Activity },
  { label: "Approvals", icon: ShieldCheck },
  { label: "Company Brain", icon: Brain },
  { label: "Analytics", icon: Zap },
]

const sectionMeta: Record<Section, { eyebrow: string; title: string; description: string }> = {
  Overview: {
    eyebrow: "AI WORKFORCE / CONTROL",
    title: "Workforce overview",
    description: "A live view of the agents, tasks, runs and approvals behind GritGrid operations.",
  },
  Agents: {
    eyebrow: "AI WORKFORCE / PEOPLE",
    title: "Agents",
    description: "Registered specialists reported by the GritGrid AI backend.",
  },
  "Command Center": {
    eyebrow: "AI WORKFORCE / CEO",
    title: "Command Center",
    description: "Send a business objective to the CEO orchestrator and follow the persisted result.",
  },
  Tasks: {
    eyebrow: "AI WORKFORCE / EXECUTION",
    title: "Tasks",
    description: "Inspect the task queue returned by the backend, with bounded client-side paging.",
  },
  "Runs / Activity": {
    eyebrow: "AI WORKFORCE / OBSERVABILITY",
    title: "Runs & activity",
    description: "Recent persisted runs and events from the workforce database.",
  },
  Approvals: {
    eyebrow: "AI WORKFORCE / GOVERNANCE",
    title: "Approval center",
    description: "Review actions that the backend has held for explicit human approval.",
  },
  "Company Brain": {
    eyebrow: "AI WORKFORCE / MEMORY",
    title: "Company Brain",
    description: "Search and maintain bounded company memory without exposing database access.",
  },
  Analytics: {
    eyebrow: "AI WORKFORCE / SIGNALS",
    title: "Analytics",
    description: "Operational counts derived from the data returned by the AI backend.",
  },
}

async function requestAi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/ai/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = payload && typeof payload === "object" && "detail" in payload ? payload.detail : null
    const error = new Error(typeof detail === "string" ? detail : `Request failed with ${response.status}`)
    error.name = `HTTP_${response.status}`
    throw error
  }
  return payload as T
}

function formatDate(value?: string | null) {
  if (!value) return "No timestamp"
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

function labelize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function friendlyError(error: unknown) {
  if (!(error instanceof Error)) return "The request could not be completed."
  if (error.name === "HTTP_401") return "Your session has expired. Sign in again to continue."
  if (error.name === "HTTP_403") return "Your account is not authorized for this action."
  if (error.name === "HTTP_404") return "This backend operation is not available."
  if (error.name === "HTTP_502" || error.name === "HTTP_503") return "The AI Workforce backend is unavailable. Try again shortly."
  if (error.message.includes("timed out")) return "The AI Workforce backend timed out. Try again shortly."
  return error.message
}

function StatusBadge({ value }: { value: string }) {
  const tone = /completed|approved|online|available|success/i.test(value)
    ? "success"
    : /running|pending|waiting/i.test(value)
      ? "warning"
      : /failed|rejected|blocked|offline|cancelled/i.test(value)
        ? "danger"
        : "muted"
  return (
    <span className={cn("statusBadge", `statusBadge-${tone}`)}>
      <span className="statusBadgeDot" />
      {labelize(value)}
    </span>
  )
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="emptyState">
      <Database className="size-5" />
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  )
}

function JsonBlock({ value }: { value: unknown }) {
  return <pre className="jsonBlock">{JSON.stringify(value, null, 2)}</pre>
}

export function AiWorkforce() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [section, setSection] = React.useState<Section>("Overview")
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [agents, setAgents] = React.useState<AgentSummary[]>([])
  const [status, setStatus] = React.useState<WorkforceStatus | null>(null)
  const [tasks, setTasks] = React.useState<TaskRecord[]>([])
  const [runs, setRuns] = React.useState<RunRecord[]>([])
  const [events, setEvents] = React.useState<EventRecord[]>([])
  const [approvals, setApprovals] = React.useState<ApprovalRecord[]>([])
  const [memory, setMemory] = React.useState<MemoryRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = React.useState<AgentSummary | null>(null)
  const [objective, setObjective] = React.useState("")
  const [objectiveResult, setObjectiveResult] = React.useState<unknown>(null)
  const [objectiveBusy, setObjectiveBusy] = React.useState(false)
  const [taskStatus, setTaskStatus] = React.useState("all")
  const [taskAgent, setTaskAgent] = React.useState("all")
  const [taskPage, setTaskPage] = React.useState(1)
  const [taskFormOpen, setTaskFormOpen] = React.useState(false)
  const [taskBusy, setTaskBusy] = React.useState(false)
  const [taskDraft, setTaskDraft] = React.useState({ title: "", description: "", assigned_agent: "", priority: "normal" })
  const [memoryQuery, setMemoryQuery] = React.useState("")
  const [memoryBusy, setMemoryBusy] = React.useState(false)
  const [memoryFormOpen, setMemoryFormOpen] = React.useState(false)
  const [memoryDraft, setMemoryDraft] = React.useState({ memory_key: "", content: "", memory_type: "company" })
  const [profileOpen, setProfileOpen] = React.useState(false)

  const loadData = React.useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true)
    else setLoading(true)
    setError(null)
    const results = await Promise.allSettled([
      requestAi<WorkforceStatus>("workforce/status"),
      requestAi<{ agents: AgentSummary[] }>("agents"),
      requestAi<TaskRecord[]>("tasks"),
      requestAi<RunRecord[]>("runs?limit=100"),
      requestAi<EventRecord[]>("events?limit=100"),
      requestAi<ApprovalRecord[]>("approvals"),
      requestAi<MemoryRecord[]>("memory"),
    ])
    const [statusResult, agentsResult, tasksResult, runsResult, eventsResult, approvalsResult, memoryResult] = results
    if (statusResult.status === "fulfilled") setStatus(statusResult.value)
    if (agentsResult.status === "fulfilled") setAgents(agentsResult.value.agents)
    if (tasksResult.status === "fulfilled") setTasks(tasksResult.value)
    if (runsResult.status === "fulfilled") setRuns(runsResult.value)
    if (eventsResult.status === "fulfilled") setEvents(eventsResult.value)
    if (approvalsResult.status === "fulfilled") setApprovals(approvalsResult.value)
    if (memoryResult.status === "fulfilled") setMemory(memoryResult.value)
    const rejected = results.find((result): result is PromiseRejectedResult => result.status === "rejected")
    if (rejected) setError(rejected.reason instanceof Error ? rejected.reason.message : "AI Workforce backend is unavailable")
    setLoading(false)
    setRefreshing(false)
  }, [])

  React.useEffect(() => {
    void loadData()
    const interval = window.setInterval(() => void loadData(true), 15_000)
    return () => window.clearInterval(interval)
  }, [loadData])

  const runMutation = React.useCallback(async (action: () => Promise<unknown>, success: string) => {
    if (!user) {
      setNotice("Sign in to the Workbench before changing workforce data.")
      return
    }
    try {
      await action()
      setNotice(success)
      await loadData(true)
    } catch (mutationError) {
      setNotice(friendlyError(mutationError))
    }
  }, [loadData, user])

  async function runObjective() {
    if (!objective.trim()) return
    if (!user) {
      setNotice("Sign in to the Workbench before sending a CEO objective.")
      return
    }
    setObjectiveBusy(true)
    setObjectiveResult(null)
    try {
      const result = await requestAi<Record<string, unknown>>("orchestrator/run", {
        method: "POST",
        body: JSON.stringify({ objective: objective.trim() }),
      })
      setObjectiveResult(result)
      setNotice("Objective submitted to the CEO orchestrator.")
      await loadData(true)
    } catch (objectiveError) {
      setNotice(friendlyError(objectiveError))
    } finally {
      setObjectiveBusy(false)
    }
  }

  const filteredTasks = tasks.filter((task) =>
    (taskStatus === "all" || task.status === taskStatus) &&
    (taskAgent === "all" || task.assigned_agent === taskAgent),
  )
  const pageSize = 8
  const visibleTasks = filteredTasks.slice((taskPage - 1) * pageSize, taskPage * pageSize)
  const pageCount = Math.max(1, Math.ceil(filteredTasks.length / pageSize))

  async function searchMemory(event?: React.FormEvent) {
    event?.preventDefault()
    setMemoryBusy(true)
    try {
      const result = await requestAi<MemoryRecord[]>(memoryQuery.trim() ? `memory?query=${encodeURIComponent(memoryQuery.trim())}` : "memory")
      setMemory(result)
      setNotice(memoryQuery.trim() ? "Memory search complete." : "Showing the latest company memory.")
    } catch (memoryError) {
      setNotice(friendlyError(memoryError))
    } finally {
      setMemoryBusy(false)
    }
  }

  const meta = sectionMeta[section]

  return (
    <main className="workbenchShell">
      <aside className={cn("workbenchSidebar", menuOpen && "workbenchSidebarOpen")}>
        <div className="workbenchBrand">
          <div className="workbenchLogo">G</div>
          <div><strong>GritGrid</strong><span>WORKBENCH</span></div>
        </div>
        <div className="sidebarKicker">AI WORKFORCE</div>
        <nav className="workforceNav" aria-label="AI Workforce">
          {navigation.map(({ label, icon: Icon }) => (
            <button key={label} className={cn("workforceNavItem", section === label && "workforceNavItemActive")} onClick={() => { setSection(label); setMenuOpen(false) }}>
              <Icon className="size-4" />
              <span>{label}</span>
              {label === "Approvals" && approvals.length > 0 && <b>{approvals.length}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebarFoot">
          <div className="secureLine"><ShieldCheck className="size-3.5" /> Server-side AI gateway</div>
          <div className="userLine">
            <div className="userAvatar">{user ? user.name.slice(0, 2).toUpperCase() : "--"}</div>
            <div><strong>{user?.name ?? "Guest session"}</strong><small>{user ? `${user.role} access` : "Read-only until sign in"}</small></div>
          </div>
        </div>
      </aside>

      {menuOpen && <button className="workbenchOverlay" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}

      <section className="workbenchContent">
        <header className="workbenchTopbar">
          <button className="mobileMenuButton" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu className="size-5" /></button>
          <div><span className="workbenchEyebrow">{meta.eyebrow}</span><h1>{meta.title}</h1></div>
          <div className="topbarActions">
            <div className={cn("systemStatus", error ? "systemStatusWarn" : "")}><span />{error ? "Backend attention" : status?.status === "online" ? "Systems ready" : "Connecting"}</div>
            <div className="profileWrap">
              <button className="profileButton" title={user ? "Open account menu" : "Sign in"} onClick={() => user ? setProfileOpen((open) => !open) : router.push("/login")}>{user ? user.name.slice(0, 2).toUpperCase() : "GG"}</button>
              {profileOpen && user && <div className="profileMenu"><strong>{user.name}</strong><span>{user.email}</span><span className="profileRole">{user.role} access</span><button onClick={async () => { await logout(); setProfileOpen(false); router.replace("/login") }}><span>Sign out</span></button></div>}
            </div>
          </div>
        </header>

        <div className="workbenchPage">
          <div className="pageIntro"><div><h2>{meta.title}</h2><p>{meta.description}</p></div><button className="outlineButton" onClick={() => void loadData(true)} disabled={refreshing}><RefreshCw className={cn("size-4", refreshing && "spin" as string)} /> Refresh</button></div>
          {notice && <div className="actionNotice"><Sparkles className="size-4" /><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice(null)}><X className="size-4" /></button></div>}
          {error && <div className="errorBanner"><XCircle className="size-4" /><div><strong>AI Workforce backend is unavailable or returned an error.</strong><span>{error}</span></div></div>}

          {section === "Overview" && <Overview status={status} agents={agents} tasks={tasks} runs={runs} events={events} approvals={approvals} loading={loading} onNavigate={setSection} />}
          {section === "Agents" && <Agents agents={agents} loading={loading} selectedAgent={selectedAgent} onSelect={setSelectedAgent} />}
          {section === "Command Center" && <CommandCenter objective={objective} setObjective={setObjective} busy={objectiveBusy} result={objectiveResult} onRun={() => void runObjective()} />}
          {section === "Tasks" && <TasksView tasks={visibleTasks} allTasks={tasks} agents={agents} status={taskStatus} setStatus={(value) => { setTaskStatus(value); setTaskPage(1) }} agent={taskAgent} setAgent={(value) => { setTaskAgent(value); setTaskPage(1) }} page={taskPage} pageCount={pageCount} setPage={setTaskPage} loading={loading} open={taskFormOpen} setOpen={setTaskFormOpen} draft={taskDraft} setDraft={setTaskDraft} busy={taskBusy} setBusy={setTaskBusy} onCreate={(input) => runMutation(async () => { const created = await requestAi<TaskRecord>("tasks", { method: "POST", body: JSON.stringify(input) }); setTasks((current) => [created, ...current]) }, "Task created in the AI backend.")} />}
          {section === "Runs / Activity" && <ActivityView runs={runs} events={events} loading={loading} />}
          {section === "Approvals" && <ApprovalsView approvals={approvals} loading={loading} onDecision={(id, decision) => void runMutation(() => requestAi(`approvals/${id}/${decision}`, { method: "POST" }), `Approval ${decision === "approve" ? "approved" : "rejected"}.`)} />}
          {section === "Company Brain" && <MemoryView memory={memory} query={memoryQuery} setQuery={setMemoryQuery} busy={memoryBusy} open={memoryFormOpen} setOpen={setMemoryFormOpen} draft={memoryDraft} setDraft={setMemoryDraft} loading={loading} onSearch={searchMemory} onSave={(input) => void runMutation(async () => { const created = await requestAi<MemoryRecord>("memory", { method: "POST", body: JSON.stringify(input) }); setMemory((current) => [created, ...current]) }, "Memory saved to the Company Brain.")} onDelete={(id) => void runMutation(async () => { await requestAi(`memory/${id}`, { method: "DELETE" }); setMemory((current) => current.filter((item) => item.id !== id)) }, "Memory deleted.")} />}
          {section === "Analytics" && <AnalyticsView status={status} tasks={tasks} runs={runs} events={events} approvals={approvals} loading={loading} />}
          <footer className="workbenchFooter">GritGrid Technologies · AI Workforce Control Center · <span>Server-side API gateway</span></footer>
        </div>
      </section>
    </main>
  )
}

function Overview({ status, agents, tasks, runs, events, approvals, loading, onNavigate }: { status: WorkforceStatus | null; agents: AgentSummary[]; tasks: TaskRecord[]; runs: RunRecord[]; events: EventRecord[]; approvals: ApprovalRecord[]; loading: boolean; onNavigate: (section: Section) => void }) {
  const cards = [
    ["Total agents", status?.total_agents, Users, "Agents registered"],
    ["Available now", status?.active_agents, CheckCircle2, "Backend availability"],
    ["Active tasks", status ? status.pending_tasks + status.running_tasks : undefined, ClipboardList, "Pending + running"],
    ["Pending approvals", approvals.length, ShieldCheck, "Human decisions needed"],
  ] as const
  return <>
    <section className="overviewHero"><div><span className="workbenchEyebrow cyanEyebrow">GRITGRID AI WORKFORCE</span><h3>Human judgment, <em>machine momentum.</em></h3><p>Observe the workforce, send objectives to the CEO, and keep consequential actions behind a human approval gate.</p></div><div className="heroSignal"><div className="signalCore"><Sparkles className="size-6" /></div><span>Persisted state</span><small>{status?.status ? labelize(status.status) : "Awaiting backend"}</small></div></section>
    <div className="metricGrid">{cards.map(([label, value, Icon, hint]) => <article className="metricCard" key={label}><div className="metricTop"><span>{label}</span><Icon className="size-4" /></div><strong>{loading ? "..." : value ?? "—"}</strong><small>{hint}</small></article>)}</div>
    <div className="contentGrid">
      <section className="surfacePanel"><div className="panelHeader"><div><span className="workbenchEyebrow">WORKFLOW</span><h3>Open a control surface</h3></div></div><div className="quickActions"><button onClick={() => onNavigate("Command Center")}><Command /><span><strong>Send an objective</strong><small>Ask the CEO to coordinate work</small></span><ChevronRight /></button><button onClick={() => onNavigate("Tasks")}><ClipboardList /><span><strong>Inspect task queue</strong><small>Review actual persisted tasks</small></span><ChevronRight /></button><button onClick={() => onNavigate("Approvals")}><ShieldCheck /><span><strong>Review approvals</strong><small>{approvals.length ? `${approvals.length} waiting for review` : "Nothing waiting right now"}</small></span><ChevronRight /></button></div></section>
      <section className="surfacePanel"><div className="panelHeader"><div><span className="workbenchEyebrow">SYSTEM FEED</span><h3>Recent activity</h3></div><button className="textButton" onClick={() => onNavigate("Runs / Activity")}>View all <ChevronRight className="size-3.5" /></button></div>{events.length ? <div className="activityList">{events.slice(0, 5).map((event) => <div className="activityItem" key={event.id}><span className="activityDot" /><div><strong>{labelize(event.event_type)}</strong><small>{event.source_agent ?? "system"} · {formatDate(event.created_at)}</small></div></div>)}</div> : <EmptyState title="No events returned" detail="The backend has not reported activity yet." />}</section>
    </div>
    <section className="statusStrip"><Activity className="size-4" /><span>{runs.length ? `${runs.length} runs and ${tasks.length} tasks are visible from the backend.` : "No run data returned yet."}</span><span className="stripAgents">{agents.length ? `${agents.length} agents registered` : "Agent registry unavailable"}</span></section>
  </>
}

function Agents({ agents, loading, selectedAgent, onSelect }: { agents: AgentSummary[]; loading: boolean; selectedAgent: AgentSummary | null; onSelect: (agent: AgentSummary | null) => void }) {
  return <div className="agentLayout"><div className="agentGrid">{loading ? <div className="loadingBox">Loading agent registry...</div> : agents.length ? agents.map((agent) => <button className={cn("agentCard", selectedAgent?.name === agent.name && "agentCardActive")} key={agent.name} onClick={() => onSelect(agent)}><div className="agentCardTop"><span className="agentMark">{agent.name.slice(0, 2).toUpperCase()}</span><StatusBadge value={agent.available ? "available" : "offline"} /></div><strong>{labelize(agent.name)}</strong><small>{agent.role ?? "Registered workforce agent"}</small><span className="agentCapabilities">{agent.capabilities?.length ? `${agent.capabilities.length} reported capabilities` : "Capabilities not reported"}</span></button>) : <EmptyState title="No agents returned" detail="The backend agent registry is empty or unavailable." />}</div>{selectedAgent && <aside className="detailPanel"><button className="closeDetail" onClick={() => onSelect(null)} aria-label="Close agent details"><X /></button><span className="workbenchEyebrow">AGENT DETAIL</span><div className="detailMark">{selectedAgent.name.slice(0, 2).toUpperCase()}</div><h3>{labelize(selectedAgent.name)}</h3><StatusBadge value={selectedAgent.available ? "available" : "offline"} /><p>{selectedAgent.role ?? "This agent did not report a role description."}</p><div className="tagList">{selectedAgent.capabilities?.length ? selectedAgent.capabilities.map((capability) => <span key={capability}>{labelize(capability)}</span>) : <span>No capabilities reported by backend</span>}</div></aside>}</div>
}

function CommandCenter({ objective, setObjective, busy, result, onRun }: { objective: string; setObjective: (value: string) => void; busy: boolean; result: unknown; onRun: () => void }) {
  return <div className="commandLayout"><section className="commandPanel"><div className="commandIcon"><Command className="size-5" /></div><span className="workbenchEyebrow">CEO ORCHESTRATOR</span><h3>What should the workforce accomplish?</h3><p>Describe the objective in business terms. The backend decides delegation and persists the workflow state.</p><textarea value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Research the Hyderabad student market and create a marketing campaign proposal." rows={6} /><button className="primaryButton" onClick={onRun} disabled={busy || !objective.trim()}>{busy ? <RefreshCw className="size-4 spin" /> : <PlayCircle className="size-4" />}{busy ? "Submitting objective" : "Send to CEO"}</button></section><section className="workflowPanel"><span className="workbenchEyebrow">WORKFLOW PATH</span><div className="workflowSteps"><div><b>01</b><span>Objective</span></div><ChevronRight /><div><b>02</b><span>CEO</span></div><ChevronRight /><div><b>03</b><span>Specialists</span></div><ChevronRight /><div><b>04</b><span>QA / result</span></div></div>{result ? <div className="resultArea"><div className="resultHeader"><strong>Backend response</strong><StatusBadge value="completed" /></div><JsonBlock value={result} /></div> : <div className="waitingArea"><Sparkles className="size-5" /><strong>Awaiting an objective</strong><p>The response shown here will be the actual orchestration result.</p></div>}</section></div>
}

function TasksView({ tasks, allTasks, agents, status, setStatus, agent, setAgent, page, pageCount, setPage, loading, open, setOpen, draft, setDraft, busy, setBusy, onCreate }: { tasks: TaskRecord[]; allTasks: TaskRecord[]; agents: AgentSummary[]; status: string; setStatus: (value: string) => void; agent: string; setAgent: (value: string) => void; page: number; pageCount: number; setPage: (value: number) => void; loading: boolean; open: boolean; setOpen: (value: boolean) => void; draft: { title: string; description: string; assigned_agent: string; priority: string }; setDraft: React.Dispatch<React.SetStateAction<{ title: string; description: string; assigned_agent: string; priority: string }>>; busy: boolean; setBusy: (value: boolean) => void; onCreate: (input: typeof draft) => Promise<void> }) {
  return <section className="surfacePanel tablePanel"><div className="panelHeader"><div><span className="workbenchEyebrow">TASK QUEUE</span><h3>{allTasks.length ? `${allTasks.length} persisted tasks` : "No persisted tasks"}</h3></div><button className="primaryButton compactButton" onClick={() => setOpen(!open)}><Plus className="size-4" /> New task</button></div>{open && <form className="inlineForm" onSubmit={async (event) => { event.preventDefault(); if (!draft.title || !draft.assigned_agent) return; setBusy(true); try { await onCreate(draft); setDraft({ title: "", description: "", assigned_agent: "", priority: "normal" }); setOpen(false) } finally { setBusy(false) } }}><input required placeholder="Task title" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} /><input placeholder="Description" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} /><select required value={draft.assigned_agent} onChange={(event) => setDraft((current) => ({ ...current, assigned_agent: event.target.value }))}><option value="">Assign agent</option>{agents.map((item) => <option key={item.name} value={item.name}>{labelize(item.name)}</option>)}</select><select value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value }))}><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select><button className="primaryButton compactButton" disabled={busy} type="submit">{busy ? "Creating" : "Create"}</button></form>}<div className="filterRow"><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{["pending", "running", "completed", "failed", "cancelled", "blocked"].map((value) => <option key={value} value={value}>{labelize(value)}</option>)}</select><select value={agent} onChange={(event) => setAgent(event.target.value)}><option value="all">All agents</option>{agents.map((item) => <option key={item.name} value={item.name}>{labelize(item.name)}</option>)}</select><span className="filterCount">{tasks.length} shown</span></div>{loading ? <div className="loadingBox">Loading tasks...</div> : tasks.length ? <div className="dataTableWrap"><table className="dataTable"><thead><tr><th>Task</th><th>Agent</th><th>Status</th><th>Priority</th><th>Created</th><th>Updated</th></tr></thead><tbody>{tasks.map((task) => <tr key={task.task_id}><td><strong>{task.task_id}</strong><span>{task.title}</span></td><td>{labelize(task.assigned_agent)}</td><td><StatusBadge value={task.status} /></td><td>{labelize(task.priority)}</td><td>{formatDate(task.created_at)}</td><td>{formatDate(task.completed_at ?? task.started_at)}</td></tr>)}</tbody></table></div> : <EmptyState title="No tasks match" detail="Try clearing the filters or create a backend task." />}<div className="pagination"><button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Previous</button><span>Page {page} of {pageCount}</span><button onClick={() => setPage(Math.min(pageCount, page + 1))} disabled={page === pageCount}>Next</button></div></section>
}

function ActivityView({ runs, events, loading }: { runs: RunRecord[]; events: EventRecord[]; loading: boolean }) {
  return <div className="contentGrid activityGrid"><section className="surfacePanel tablePanel"><div className="panelHeader"><div><span className="workbenchEyebrow">RUNS</span><h3>Agent runs</h3></div></div>{loading ? <div className="loadingBox">Loading runs...</div> : runs.length ? <div className="dataTableWrap"><table className="dataTable"><thead><tr><th>Agent</th><th>Status</th><th>Started</th><th>Result</th></tr></thead><tbody>{runs.map((run) => <tr key={run.id}><td><strong>{labelize(run.agent_name)}</strong><span>Run #{run.id}</span></td><td><StatusBadge value={run.status} /></td><td>{formatDate(run.started_at)}</td><td>{run.error ?? (run.result ? "Result returned" : "No result")}</td></tr>)}</tbody></table></div> : <EmptyState title="No runs returned" detail="The backend has not persisted any agent runs." />}</section><section className="surfacePanel"><div className="panelHeader"><div><span className="workbenchEyebrow">EVENT STREAM</span><h3>Events</h3></div></div>{events.length ? <div className="eventList">{events.slice(0, 20).map((event) => <div className="eventItem" key={event.id}><span className="eventType">{labelize(event.event_type)}</span><strong>{event.source_agent ?? "system"}{event.target_agent ? ` → ${event.target_agent}` : ""}</strong><small>{formatDate(event.created_at)}</small></div>)}</div> : <EmptyState title="No events returned" detail="Events will appear here as work is persisted." />}</section></div>
}

function ApprovalsView({ approvals, loading, onDecision }: { approvals: ApprovalRecord[]; loading: boolean; onDecision: (id: number, decision: "approve" | "reject") => void }) {
  return <section className="surfacePanel"><div className="panelHeader"><div><span className="workbenchEyebrow">HUMAN GATE</span><h3>Pending approvals</h3></div><StatusBadge value={`${approvals.length} pending`} /></div>{loading ? <div className="loadingBox">Loading approvals...</div> : approvals.length ? <div className="approvalList">{approvals.map((approval) => <article className="approvalItem" key={approval.id}><div className="approvalIcon"><ShieldCheck className="size-5" /></div><div className="approvalBody"><div className="approvalTop"><strong>{labelize(approval.action)}</strong><span>#{approval.id}</span></div><p>{approval.description}</p><small>Requested by {approval.requested_by} · {formatDate(approval.created_at)}{approval.task_id ? ` · Task ${approval.task_id}` : ""}</small></div><div className="approvalActions"><button className="approveButton" onClick={() => onDecision(approval.id, "approve")}><Check className="size-4" /> Approve</button><button className="rejectButton" onClick={() => onDecision(approval.id, "reject")}><X className="size-4" /> Reject</button></div></article>)}</div> : <EmptyState title="No approvals waiting" detail="The backend has no pending approval decisions." />}</section>
}

function MemoryView({ memory, query, setQuery, busy, open, setOpen, draft, setDraft, loading, onSearch, onSave, onDelete }: { memory: MemoryRecord[]; query: string; setQuery: (value: string) => void; busy: boolean; open: boolean; setOpen: (value: boolean) => void; draft: { memory_key: string; content: string; memory_type: string }; setDraft: React.Dispatch<React.SetStateAction<{ memory_key: string; content: string; memory_type: string }>>; loading: boolean; onSearch: (event?: React.FormEvent) => void; onSave: (input: typeof draft) => void; onDelete: (id: number) => void }) {
  return <section className="surfacePanel"><div className="panelHeader"><div><span className="workbenchEyebrow">COMPANY MEMORY</span><h3>Search the Company Brain</h3></div><button className="primaryButton compactButton" onClick={() => setOpen(!open)}><Plus className="size-4" /> Add memory</button></div><form className="searchRow" onSubmit={onSearch}><Search className="size-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search keys and content" /><button type="submit" disabled={busy}>{busy ? "Searching" : "Search"}</button></form>{open && <form className="memoryForm" onSubmit={(event) => { event.preventDefault(); if (!draft.memory_key || !draft.content) return; onSave(draft); setDraft({ memory_key: "", content: "", memory_type: "company" }); setOpen(false) }}><input required placeholder="Memory key" value={draft.memory_key} onChange={(event) => setDraft((current) => ({ ...current, memory_key: event.target.value }))} /><select value={draft.memory_type} onChange={(event) => setDraft((current) => ({ ...current, memory_type: event.target.value }))}><option value="company">Company</option><option value="process">Process</option><option value="agent">Agent</option></select><textarea required placeholder="Content" rows={4} value={draft.content} onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))} /><button className="primaryButton compactButton" type="submit">Save memory</button></form>}{loading ? <div className="loadingBox">Loading memory...</div> : memory.length ? <div className="memoryList">{memory.map((item) => <article className="memoryItem" key={item.id}><div className="memoryTop"><div><strong>{item.memory_key}</strong><span>{item.memory_type}</span></div><button className="iconButton" aria-label={`Delete ${item.memory_key}`} onClick={() => onDelete(item.id)}><X className="size-4" /></button></div><p>{item.content}</p><small>{formatDate(item.created_at)}</small></article>)}</div> : <EmptyState title="No memory returned" detail="The backend returned no company memory for this view." />}</section>
}

function AnalyticsView({ status, tasks, runs, events, approvals, loading }: { status: WorkforceStatus | null; tasks: TaskRecord[]; runs: RunRecord[]; events: EventRecord[]; approvals: ApprovalRecord[]; loading: boolean }) {
  const taskStatuses = ["pending", "running", "completed", "failed", "blocked", "cancelled"]
  return <div className="analyticsLayout"><div className="metricGrid analyticsMetrics">{[["Tasks returned", tasks.length], ["Runs returned", runs.length], ["Events returned", events.length], ["Pending approvals", approvals.length]].map(([label, value]) => <article className="metricCard" key={label}><div className="metricTop"><span>{label}</span><Activity className="size-4" /></div><strong>{loading ? "..." : value}</strong><small>Backend response count</small></article>)}</div><div className="contentGrid"><section className="surfacePanel"><div className="panelHeader"><div><span className="workbenchEyebrow">TASK DISTRIBUTION</span><h3>Tasks by status</h3></div></div>{tasks.length ? <div className="barList">{taskStatuses.map((taskStatus) => { const count = tasks.filter((task) => task.status === taskStatus).length; const width = tasks.length ? Math.max(4, (count / tasks.length) * 100) : 0; return <div className="barRow" key={taskStatus}><span>{labelize(taskStatus)}</span><div><i style={{ width: `${width}%` }} /></div><strong>{count}</strong></div> })}</div> : <EmptyState title="No task data" detail="Analytics appear when the backend returns tasks." />}</section><section className="surfacePanel"><div className="panelHeader"><div><span className="workbenchEyebrow">WORKFORCE SIGNAL</span><h3>Reported backend status</h3></div></div>{status ? <div className="signalList"><div><span>Agents registered</span><strong>{status.total_agents}</strong></div><div><span>Active agents</span><strong>{status.active_agents}</strong></div><div><span>Pending tasks</span><strong>{status.pending_tasks}</strong></div><div><span>Running tasks</span><strong>{status.running_tasks}</strong></div><div><span>Completed tasks</span><strong>{status.completed_tasks}</strong></div><div><span>Failed tasks</span><strong>{status.failed_tasks}</strong></div></div> : <EmptyState title="No status data" detail="The backend did not return workforce status." />}</section></div></div>
}