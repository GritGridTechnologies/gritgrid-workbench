import { cn } from "@/lib/utils"

/**
 * GritGrid brand logo.
 *
 * NOTE: This renders a swappable placeholder mark until the official logo file
 * is provided. To use the real asset, drop it in /public (e.g. /logo.svg) and
 * replace the <LogoMark> SVG below with an <Image src="/logo.svg" .../>.
 * Everything else (sizing, wordmark, usage across login/sidebar/header) stays.
 */

export function LogoMark({
  size = 36,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="GritGrid Technologies"
    >
      <rect width="40" height="40" rx="9" fill="var(--brand-navy)" />
      <g
        fill="none"
        stroke="var(--brand-blue)"
        strokeWidth="2.2"
        strokeLinecap="round"
      >
        <path d="M11 14h8" />
        <path d="M11 20h13" />
        <path d="M11 26h6" />
      </g>
      <circle cx="27.5" cy="14" r="2.6" fill="var(--brand-orange)" />
      <circle cx="21" cy="26" r="2.6" fill="var(--brand-purple)" />
    </svg>
  )
}

interface LogoProps {
  className?: string
  showTagline?: boolean
  onDark?: boolean
  markSize?: number
}

export function Logo({
  className,
  showTagline = true,
  onDark = false,
  markSize = 36,
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={markSize} className="rounded-[9px]" />
      <div className="leading-none">
        <div
          className={cn(
            "text-[15px] font-bold tracking-tight",
            onDark ? "text-white" : "text-foreground",
          )}
        >
          Grit<span className="text-brand-blue">Grid</span>
        </div>
        {showTagline && (
          <div
            className={cn(
              "mt-1 font-mono text-[9px] uppercase tracking-[0.18em]",
              onDark ? "text-sidebar-foreground/60" : "text-muted-foreground",
            )}
          >
            Workbench
          </div>
        )}
      </div>
    </div>
  )
}
