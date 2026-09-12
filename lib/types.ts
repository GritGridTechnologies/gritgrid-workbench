export type Role = "OWNER" | "MANAGER" | "EMPLOYEE"

export type ProjectStatus =
  | "Planning"
  | "Active"
  | "On Hold"
  | "Review"
  | "Completed"
  | "Cancelled"

export type TaskStatus =
  | "Todo"
  | "In Progress"
  | "Blocked"
  | "Review"
  | "Completed"

export type Priority = "Low" | "Medium" | "High" | "Urgent"

export type EnquiryStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "In Progress"
  | "Converted"
  | "Closed"
  | "Lost"

export type LeaveStatus = "Pending" | "Approved" | "Rejected"

export type ApprovalStage = "Manager" | "Owner" | "Approved" | "Rejected"

export type StatisticKey = "completedProjects" | "liveProjects"

export interface Employee {
  id: string
  name: string
  email: string
  role: Role
  department: string
  title: string
  phone: string
  joinedDate: string
  skills: string[]
  status: "Active" | "On Leave" | "Offline"
  attendanceStatus: "Checked In" | "Checked Out" | "Not Started"
  lastActive: string
  avatarColor: string
}

export interface Project {
  id: string
  name: string
  client: string
  category: string
  description: string
  managerId: string
  memberIds: string[]
  startDate: string
  deadline: string
  progress: number
  status: ProjectStatus
  lastActivity: string
  value: number
}

export interface Task {
  id: string
  title: string
  description: string
  projectId: string | null
  assigneeId: string
  priority: Priority
  status: TaskStatus
  dueDate: string
  createdDate: string
  updatedDate: string
}

export interface Enquiry {
  id: string
  name: string
  contact: string
  email: string
  source: string
  service: string
  description: string
  assigneeId: string | null
  priority: Priority
  status: EnquiryStatus
  createdDate: string
  updatedDate: string
  followUpDate: string | null
}

export interface LeaveRequest {
  id: string
  employeeId: string
  type: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: LeaveStatus
  appliedDate: string
}

export interface CompanyStatistics {
  totalEnquiries: number
  completedProjects: number
  liveProjects: number
}

export interface ApprovalEvent {
  stage: "Created" | "Manager" | "Owner"
  actorId: string
  actorName: string
  decision: "created" | "approved" | "rejected"
  reason?: string
  timestamp: string
}

export interface StatisticsApprovalRequest {
  id: string
  statistic: StatisticKey
  label: string
  delta: number
  oldValue: number
  requestedNewValue: number
  reason: string
  projectId: string | null
  projectName: string | null
  requestedById: string
  requestedByName: string
  stage: ApprovalStage
  createdAt: string
  managerApprovedBy?: string
  ownerApprovedBy?: string
  history: ApprovalEvent[]
  /** true when the request also flips a project Active -> Completed */
  completesProject?: boolean
}

export type NotificationType =
  | "enquiry"
  | "task"
  | "deadline"
  | "project"
  | "leave"
  | "approval"
  | "statistics"

export interface WorkbenchNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  timestamp: string
  read: boolean
  forRoles?: Role[]
  forUserId?: string
}

export interface AuditLogEntry {
  id: string
  actorId: string
  actorName: string
  action: string
  entity: string
  entityId: string
  timestamp: string
  metadata?: Record<string, string | number>
}

export interface ActivityEvent {
  id: string
  time: string
  label: string
  kind: "check-in" | "task" | "enquiry" | "project" | "approval" | "system"
}
