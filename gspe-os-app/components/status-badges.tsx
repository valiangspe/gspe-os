import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type {
  ActionClass,
  AutonomyLevel,
  CheckStatus,
  ControlStatus,
  InterfaceHealth,
  MetricStatus,
  PolicyOutcome,
  StopLevel,
} from "@/lib/mock/types"

function Pill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium tabular-nums", className)}
    >
      {children}
    </Badge>
  )
}

const C_OK = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
const C_WARN = "bg-amber-500/15 text-amber-700 dark:text-amber-400"
const C_BAD = "bg-red-500/15 text-red-700 dark:text-red-400"
const C_INFO = "bg-sky-500/15 text-sky-700 dark:text-sky-400"
const C_MUTE = "bg-muted text-muted-foreground"
const C_NEUTRAL = "bg-foreground/10 text-foreground"

// Control status — the honesty badge. Active is visually distinct from Tested.
export function ControlStatusBadge({ status }: { status: ControlStatus }) {
  const map: Record<ControlStatus, string> = {
    Proposed: C_MUTE,
    Designed: C_INFO,
    Tested: C_WARN,
    Active: C_OK,
    Suspended: C_BAD,
    Retired: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 line-through",
  }
  return <Pill className={map[status]}>{status}</Pill>
}

export function OutcomeBadge({ outcome }: { outcome: PolicyOutcome }) {
  const map: Record<PolicyOutcome, string> = {
    ALLOW: C_OK,
    REQUIRE_APPROVAL: C_WARN,
    DENY: C_BAD,
    DEGRADE: C_INFO,
  }
  const label: Record<PolicyOutcome, string> = {
    ALLOW: "Allow",
    REQUIRE_APPROVAL: "Require approval",
    DENY: "Deny",
    DEGRADE: "Degrade",
  }
  return <Pill className={map[outcome]}>{label[outcome]}</Pill>
}

export function ActionClassBadge({ value }: { value: ActionClass }) {
  // C0-C1 low, C2-C3 medium, C4-C5 high risk.
  const rank = Number(value.slice(1))
  const cls = rank <= 1 ? C_OK : rank <= 3 ? C_WARN : C_BAD
  return <Pill className={cls}>{value}</Pill>
}

export function AutonomyBadge({ value }: { value: AutonomyLevel }) {
  return <Pill className={C_NEUTRAL}>{value}</Pill>
}

export function CheckStatusBadge({ status }: { status: CheckStatus }) {
  const map: Record<CheckStatus, string> = {
    pass: C_OK,
    fail: C_BAD,
    na: C_MUTE,
  }
  const label: Record<CheckStatus, string> = { pass: "Pass", fail: "Fail", na: "n/a" }
  return <Pill className={map[status]}>{label[status]}</Pill>
}

export function HealthDot({ status }: { status: MetricStatus | InterfaceHealth }) {
  const map: Record<string, string> = {
    green: "bg-emerald-500",
    yellow: "bg-amber-500",
    red: "bg-red-500",
    na: "bg-muted-foreground/40",
  }
  return (
    <span
      className={cn("inline-block size-2.5 rounded-full", map[status])}
      aria-label={status}
    />
  )
}

export function StopLevelBadge({ level }: { level: StopLevel }) {
  const map: Record<StopLevel, string> = {
    none: C_OK,
    soft: C_WARN,
    functional: C_WARN,
    hard: C_BAD,
  }
  const label: Record<StopLevel, string> = {
    none: "Running",
    soft: "Soft stop",
    functional: "Functional stop",
    hard: "Hard stop",
  }
  return <Pill className={map[level]}>{label[level]}</Pill>
}

export function AuthorityBadge({ children }: { children: React.ReactNode }) {
  return <Pill className={C_INFO}>{children}</Pill>
}
