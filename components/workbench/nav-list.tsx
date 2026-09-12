"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NAV_GROUPS, NAV_ITEMS } from "@/lib/nav"
import { can } from "@/lib/permissions"
import type { Role } from "@/lib/types"
import { cn } from "@/lib/utils"

export function NavList({
  role,
  onNavigate,
}: {
  role: Role | undefined
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const items = NAV_ITEMS.filter(
    (item) => !item.capability || can(role, item.capability),
  )

  return (
    <nav className="flex flex-col gap-4" aria-label="Primary">
      {NAV_GROUPS.map((group) => {
        const groupItems = items.filter((i) => i.group === group)
        if (groupItems.length === 0) return null
        return (
          <div key={group}>
            <p className="px-3 pb-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/40">
              {group}
            </p>
            <ul className="flex flex-col gap-0.5">
              {groupItems.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/")
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium outline-none transition-all duration-200",
                        "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0 transition-colors",
                          active
                            ? "text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground",
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}
