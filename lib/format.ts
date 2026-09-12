import type {
  EnquiryStatus,
  LeaveStatus,
  Priority,
  ProjectStatus,
  TaskStatus,
} from "./types"

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "danger"
  | "purple"
  | "muted"

export const PROJECT_STATUS_VARIANT: Record<ProjectStatus, BadgeVariant> = {
  Planning: "muted",
  Active: "default",
  "On Hold": "warning",
  Review: "purple",
  Completed: "success",
  Cancelled: "danger",
}

export const TASK_STATUS_VARIANT: Record<TaskStatus, BadgeVariant> = {
  Todo: "muted",
  "In Progress": "default",
  Blocked: "danger",
  Review: "purple",
  Completed: "success",
}

export const ENQUIRY_STATUS_VARIANT: Record<EnquiryStatus, BadgeVariant> = {
  New: "default",
  Contacted: "secondary",
  Qualified: "purple",
  "In Progress": "warning",
  Converted: "success",
  Closed: "muted",
  Lost: "danger",
}

export const LEAVE_STATUS_VARIANT: Record<LeaveStatus, BadgeVariant> = {
  Pending: "warning",
  Approved: "success",
  Rejected: "danger",
}

export const PRIORITY_VARIANT: Record<Priority, BadgeVariant> = {
  Low: "muted",
  Medium: "secondary",
  High: "warning",
  Urgent: "danger",
}

export function formatCurrency(value: number) {
  if (value >= 10000000)
    return `₹${(value / 10000000).toFixed(2)} Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`
  return `₹${value.toLocaleString("en-IN")}`
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function formatDateTime(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function relativeTime(value: string) {
  const d = new Date(value).getTime()
  if (Number.isNaN(d)) return value
  const diff = Date.now() - d
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.round(hrs / 24)
  return `${days} day${days > 1 ? "s" : ""} ago`
}
