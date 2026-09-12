"use client"

import * as React from "react"
import { useAuth } from "./auth"
import { can } from "./permissions"
import {
  enquiries as seedEnquiries,
  initialNotifications,
  initialAuditLog,
  projects as seedProjects,
} from "./mock-data"
import type {
  ApprovalEvent,
  AuditLogEntry,
  CompanyStatistics,
  Enquiry,
  Priority,
  Project,
  StatisticKey,
  StatisticsApprovalRequest,
  WorkbenchNotification,
} from "./types"

/**
 * ---------------------------------------------------------------------------
 * WORKBENCH STORE (demo, in-memory)
 * ---------------------------------------------------------------------------
 * Drives the live behaviours the spec cares about: automatic enquiry counting,
 * and the two-stage Manager -> Owner statistics approval workflow with a full
 * audit trail. All mutations re-check role capability (never UI-only).
 *
 * Company statistics intentionally START AT ZERO. The public website shows
 * 347 / 149 / 6 but those are never used as internal truth. The enquiry
 * counter reflects real enquiry records; completed/live projects only ever
 * change through an approved request.
 */

let seq = 1000
const nextId = (prefix: string) => `${prefix}-${++seq}`
const now = () => new Date().toISOString()

interface CreateEnquiryInput {
  name: string
  contact: string
  email: string
  source: string
  service: string
  description: string
  priority: Priority
}

interface WorkbenchState {
  statistics: CompanyStatistics
  enquiries: Enquiry[]
  projects: Project[]
  requests: StatisticsApprovalRequest[]
  notifications: WorkbenchNotification[]
  auditLog: AuditLogEntry[]
}

interface WorkbenchContextValue extends WorkbenchState {
  createEnquiry: (input: CreateEnquiryInput) => void
  requestStatUpdate: (input: {
    statistic: StatisticKey
    delta: number
    reason: string
    projectId?: string | null
  }) => void
  requestProjectCompletion: (projectId: string, reason: string) => void
  decideAsManager: (requestId: string, approve: boolean, reason?: string) => void
  decideAsOwner: (requestId: string, approve: boolean, reason?: string) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
}

const WorkbenchContext = React.createContext<WorkbenchContextValue | null>(null)

const STAT_LABEL: Record<StatisticKey, string> = {
  completedProjects: "Completed Projects",
  liveProjects: "Live Projects",
}

export function WorkbenchProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  const [state, setState] = React.useState<WorkbenchState>(() => ({
    statistics: {
      // Real count from enquiry records; completed/live governed by approvals.
      totalEnquiries: seedEnquiries.length,
      completedProjects: 0,
      liveProjects: 0,
    },
    enquiries: seedEnquiries,
    projects: seedProjects,
    requests: [],
    notifications: initialNotifications,
    auditLog: initialAuditLog,
  }))

  const pushAudit = React.useCallback(
    (entry: Omit<AuditLogEntry, "id" | "timestamp" | "actorId" | "actorName">) => {
      setState((s) => ({
        ...s,
        auditLog: [
          {
            ...entry,
            id: nextId("AUD"),
            timestamp: now(),
            actorId: user?.id ?? "SYSTEM",
            actorName: user?.name ?? "System",
          },
          ...s.auditLog,
        ],
      }))
    },
    [user],
  )

  const notify = React.useCallback(
    (n: Omit<WorkbenchNotification, "id" | "timestamp" | "read">) => {
      setState((s) => ({
        ...s,
        notifications: [
          { ...n, id: nextId("NTF"), timestamp: now(), read: false },
          ...s.notifications,
        ],
      }))
    },
    [],
  )

  const createEnquiry = React.useCallback(
    (input: CreateEnquiryInput) => {
      const enquiry: Enquiry = {
        id: nextId("ENQ"),
        ...input,
        assigneeId: null,
        status: "New",
        createdDate: now(),
        updatedDate: now(),
        followUpDate: null,
      }
      setState((s) => ({
        ...s,
        enquiries: [enquiry, ...s.enquiries],
        // Automatic, transactional increment — no approval required.
        statistics: {
          ...s.statistics,
          totalEnquiries: s.statistics.totalEnquiries + 1,
        },
      }))
      pushAudit({
        action: "enquiry.created",
        entity: "Enquiry",
        entityId: enquiry.id,
        metadata: { name: enquiry.name, service: enquiry.service },
      })
      notify({
        type: "enquiry",
        title: "New enquiry received",
        body: `${enquiry.name} submitted an enquiry for ${enquiry.service}.`,
        forRoles: ["OWNER", "MANAGER", "EMPLOYEE"],
      })
    },
    [notify, pushAudit],
  )

  const createRequest = React.useCallback(
    (opts: {
      statistic: StatisticKey
      delta: number
      reason: string
      projectId?: string | null
      completesProject?: boolean
    }) => {
      if (!user || !can(user.role, "stats.request")) return
      const current = state.statistics[opts.statistic]
      const project = opts.projectId
        ? state.projects.find((p) => p.id === opts.projectId) ?? null
        : null
      const created: ApprovalEvent = {
        stage: "Created",
        actorId: user.id,
        actorName: user.name,
        decision: "created",
        reason: opts.reason,
        timestamp: now(),
      }
      const request: StatisticsApprovalRequest = {
        id: nextId("REQ"),
        statistic: opts.statistic,
        label: STAT_LABEL[opts.statistic],
        delta: opts.delta,
        oldValue: current,
        requestedNewValue: current + opts.delta,
        reason: opts.reason,
        projectId: opts.projectId ?? null,
        projectName: project?.name ?? null,
        requestedById: user.id,
        requestedByName: user.name,
        stage: "Manager",
        createdAt: now(),
        history: [created],
        completesProject: opts.completesProject,
      }
      setState((s) => ({ ...s, requests: [request, ...s.requests] }))
      pushAudit({
        action: "statistics.request_created",
        entity: "StatisticsRequest",
        entityId: request.id,
        metadata: { statistic: request.label, delta: opts.delta },
      })
      notify({
        type: "approval",
        title: "Approval requested",
        body: `${user.name} requested ${STAT_LABEL[opts.statistic]} ${opts.delta >= 0 ? "+" : ""}${opts.delta}.`,
        forRoles: ["MANAGER", "OWNER"],
      })
    },
    [notify, pushAudit, state.statistics, state.projects, user],
  )

  const requestStatUpdate = React.useCallback(
    (input: {
      statistic: StatisticKey
      delta: number
      reason: string
      projectId?: string | null
    }) => createRequest(input),
    [createRequest],
  )

  const requestProjectCompletion = React.useCallback(
    (projectId: string, reason: string) => {
      createRequest({
        statistic: "completedProjects",
        delta: 1,
        reason,
        projectId,
        completesProject: true,
      })
    },
    [createRequest],
  )

  const applyApproved = React.useCallback(
    (req: StatisticsApprovalRequest) => {
      setState((s) => {
        const stats = { ...s.statistics }
        if (req.statistic === "completedProjects") {
          stats.completedProjects = Math.max(0, stats.completedProjects + req.delta)
        } else {
          stats.liveProjects = Math.max(0, stats.liveProjects + req.delta)
        }
        let projects = s.projects
        if (req.completesProject && req.projectId) {
          // Atomic: completed +1 already applied above, live -1 here (>= 0).
          stats.liveProjects = Math.max(0, stats.liveProjects - 1)
          projects = s.projects.map((p) =>
            p.id === req.projectId
              ? { ...p, status: "Completed", progress: 100, lastActivity: "just now" }
              : p,
          )
        }
        return { ...s, statistics: stats, projects }
      })
    },
    [],
  )

  const decideAsManager = React.useCallback(
    (requestId: string, approve: boolean, reason?: string) => {
      if (!user || !can(user.role, "stats.approveManager")) return
      setState((s) => ({
        ...s,
        requests: s.requests.map((r) => {
          if (r.id !== requestId || r.stage !== "Manager") return r // prevent duplicates
          const event: ApprovalEvent = {
            stage: "Manager",
            actorId: user.id,
            actorName: user.name,
            decision: approve ? "approved" : "rejected",
            reason,
            timestamp: now(),
          }
          return {
            ...r,
            stage: approve ? "Owner" : "Rejected",
            managerApprovedBy: approve ? user.name : r.managerApprovedBy,
            history: [...r.history, event],
          }
        }),
      }))
      const req = state.requests.find((r) => r.id === requestId)
      pushAudit({
        action: approve ? "statistics.manager_approved" : "statistics.manager_rejected",
        entity: "StatisticsRequest",
        entityId: requestId,
        metadata: reason ? { reason } : undefined,
      })
      if (approve) {
        notify({
          type: "approval",
          title: "Owner approval needed",
          body: `A statistics request passed manager review and awaits owner approval.`,
          forRoles: ["OWNER"],
        })
      } else if (req) {
        notify({
          type: "approval",
          title: "Statistics request rejected",
          body: `Your request for ${req.label} was rejected by the manager.`,
          forUserId: req.requestedById,
        })
      }
    },
    [notify, pushAudit, state.requests, user],
  )

  const decideAsOwner = React.useCallback(
    (requestId: string, approve: boolean, reason?: string) => {
      if (!user || !can(user.role, "stats.approveOwner")) return
      const req = state.requests.find((r) => r.id === requestId)
      if (!req || req.stage !== "Owner") return // prevent duplicates / out-of-order
      setState((s) => ({
        ...s,
        requests: s.requests.map((r) => {
          if (r.id !== requestId || r.stage !== "Owner") return r
          const event: ApprovalEvent = {
            stage: "Owner",
            actorId: user.id,
            actorName: user.name,
            decision: approve ? "approved" : "rejected",
            reason,
            timestamp: now(),
          }
          return {
            ...r,
            stage: approve ? "Approved" : "Rejected",
            ownerApprovedBy: approve ? user.name : r.ownerApprovedBy,
            history: [...r.history, event],
          }
        }),
      }))
      if (approve) applyApproved(req)
      pushAudit({
        action: approve ? "statistics.owner_approved" : "statistics.owner_rejected",
        entity: "StatisticsRequest",
        entityId: requestId,
        metadata: reason ? { reason } : undefined,
      })
      notify({
        type: approve ? "statistics" : "approval",
        title: approve ? "Statistics updated" : "Statistics request rejected",
        body: approve
          ? `${req.label} was updated to ${req.requestedNewValue} after owner approval.`
          : `Your request for ${req.label} was rejected by the owner.`,
        forUserId: req.requestedById,
      })
      if (approve) {
        notify({
          type: "statistics",
          title: "Official statistics changed",
          body: `${req.label} is now ${req.requestedNewValue}.`,
          forRoles: ["OWNER", "MANAGER"],
        })
      }
    },
    [applyApproved, notify, pushAudit, state.requests, user],
  )

  const markNotificationRead = React.useCallback((id: string) => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }))
  }, [])

  const markAllNotificationsRead = React.useCallback(() => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }))
  }, [])

  const value = React.useMemo<WorkbenchContextValue>(
    () => ({
      ...state,
      createEnquiry,
      requestStatUpdate,
      requestProjectCompletion,
      decideAsManager,
      decideAsOwner,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [
      state,
      createEnquiry,
      requestStatUpdate,
      requestProjectCompletion,
      decideAsManager,
      decideAsOwner,
      markNotificationRead,
      markAllNotificationsRead,
    ],
  )

  return (
    <WorkbenchContext.Provider value={value}>
      {children}
    </WorkbenchContext.Provider>
  )
}

export function useWorkbench() {
  const ctx = React.useContext(WorkbenchContext)
  if (!ctx) throw new Error("useWorkbench must be used within WorkbenchProvider")
  return ctx
}

/** Notifications visible to a given user, honoring role/user targeting. */
export function visibleNotifications(
  notifications: WorkbenchNotification[],
  userId: string | undefined,
  role: string | undefined,
) {
  return notifications.filter((n) => {
    if (n.forUserId) return n.forUserId === userId
    if (n.forRoles) return role ? n.forRoles.includes(role as never) : false
    return true
  })
}
