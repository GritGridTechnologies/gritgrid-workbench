"use client"

import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  ChevronsUpDown,
  LogOut,
  Moon,
  Sun,
  User,
  Settings as SettingsIcon,
  Repeat,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { ROLE_LABEL } from "@/lib/permissions"
import { initials } from "@/lib/mock-data"
import type { Role } from "@/lib/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const ROLES: Role[] = ["OWNER", "MANAGER", "EMPLOYEE"]

export function UserMenu({ variant = "sidebar" }: { variant?: "sidebar" | "top" }) {
  const { user, logout, loginAs } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const router = useRouter()

  if (!user) return null

  const trigger =
    variant === "sidebar" ? (
      <button
        className="flex w-full items-center gap-3 rounded-md border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        aria-label="Account menu"
      >
        <Avatar className="size-8">
          <AvatarFallback
            style={{ backgroundColor: user.avatarColor + "22", color: user.avatarColor }}
          >
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-sidebar-foreground">
            {user.name}
          </span>
          <span className="block truncate font-mono text-[10px] uppercase tracking-wide text-sidebar-foreground/50">
            {ROLE_LABEL[user.role]}
          </span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-sidebar-foreground/50" />
      </button>
    ) : (
      <button
        className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Account menu"
      >
        <Avatar className="size-8">
          <AvatarFallback
            style={{ backgroundColor: user.avatarColor + "22", color: user.avatarColor }}
          >
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
      </button>
    )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align={variant === "sidebar" ? "start" : "end"}
        side={variant === "sidebar" ? "top" : "bottom"}
        className="w-60"
      >
        <DropdownMenuLabel className="flex flex-col gap-0.5 normal-case">
          <span className="text-sm font-medium text-foreground">{user.name}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
          <span className="pt-1">
            <Badge variant="purple">{user.title}</Badge>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <User /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <SettingsIcon /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {resolvedTheme === "dark" ? <Sun /> : <Moon />}
          {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-1.5">
          <Repeat className="size-3" /> Demo: switch role
        </DropdownMenuLabel>
        <div className="flex gap-1 px-2 pb-1.5">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => loginAs(r)}
              className={cn(
                "flex-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
                user.role === r
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            logout()
            router.replace("/login")
          }}
          className="text-danger focus:text-danger [&_svg]:text-danger"
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
