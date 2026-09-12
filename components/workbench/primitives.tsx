import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { TrendingDown, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

type Tone = "success" | "warning" | "danger" | "info" | "muted"

const TONE_DOT: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  muted: "bg-muted-foreground",
}

export function StatusDot({
  tone = "muted",
  pulse = false,
  className,
}: {
  tone?: Tone
  pulse?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        "relative inline-flex size-2 shrink-0 rounded-full",
        TONE_DOT[tone],
        pulse && "animate-pulse-dot",
        className,
      )}
      aria-hidden
    />
  )
}

interface KpiCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  hint?: string
  trend?: { value: string; direction: "up" | "down" }
  accent?: "blue" | "purple" | "orange" | "green" | "neutral"
}

const ACCENT: Record<
  NonNullable<KpiCardProps["accent"]>,
  { icon: string; ring: string }
> = {
  blue: { icon: "text-brand-blue bg-brand-blue/10", ring: "" },
  purple: { icon: "text-brand-purple bg-brand-purple/10", ring: "" },
  orange: { icon: "text-brand-orange bg-brand-orange/10", ring: "" },
  green: { icon: "text-success bg-success/10", ring: "" },
  neutral: { icon: "text-muted-foreground bg-muted", ring: "" },
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  accent = "neutral",
}: KpiCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
            {value}
          </p>
        </div>
        {Icon && (
          <span
            className={cn(
              "grid size-9 place-items-center rounded-md",
              ACCENT[accent].icon,
            )}
          >
            <Icon className="size-5" />
          </span>
        )}
      </div>
      {(hint || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-medium",
                trend.direction === "up" ? "text-success" : "text-danger",
              )}
            >
              {trend.direction === "up" ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
              {trend.value}
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      )}
    </div>
  )
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-card shadow-sm",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </header>
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-pretty text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

export function MetaLabel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "font-mono text-[11px] uppercase tracking-wide text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  )
}
