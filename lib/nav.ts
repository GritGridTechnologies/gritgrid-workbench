import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Briefcase,
  FolderKanban,
  Inbox,
  ListChecks,
  CalendarClock,
  Plane,
  Users,
  FileText,
  BarChart3,
  Bell,
  Wallet,
  Settings,
  ShieldCheck,
  CheckSquare,
} from "lucide-react"
import type { Capability } from "./permissions"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  capability?: Capability
  group: "Overview" | "Work" | "People" | "Insights" | "Account"
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Overview" },
  { label: "My Work", href: "/my-work", icon: Briefcase, group: "Overview" },

  { label: "Projects", href: "/projects", icon: FolderKanban, group: "Work" },
  { label: "Enquiries", href: "/enquiries", icon: Inbox, group: "Work" },
  { label: "Tasks", href: "/tasks", icon: ListChecks, group: "Work" },
  { label: "Attendance", href: "/attendance", icon: CalendarClock, group: "Work" },
  { label: "Leave", href: "/leave", icon: Plane, group: "Work" },

  { label: "Team", href: "/team", icon: Users, group: "People" },
  { label: "Documents", href: "/documents", icon: FileText, group: "People" },

  { label: "Statistics", href: "/statistics", icon: BarChart3, group: "Insights" },
  {
    label: "Approvals",
    href: "/approvals",
    icon: CheckSquare,
    capability: "stats.approveManager",
    group: "Insights",
  },
  { label: "Notifications", href: "/notifications", icon: Bell, group: "Insights" },
  {
    label: "Finance",
    href: "/finance",
    icon: Wallet,
    capability: "finance.viewOperational",
    group: "Insights",
  },
  {
    label: "Audit Log",
    href: "/audit",
    icon: ShieldCheck,
    capability: "audit.view",
    group: "Insights",
  },

  { label: "Settings", href: "/settings", icon: Settings, group: "Account" },
]

export const NAV_GROUPS: NavItem["group"][] = [
  "Overview",
  "Work",
  "People",
  "Insights",
  "Account",
]
