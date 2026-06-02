import type { RoleId } from "@/lib/mock/types"

// Role-aware navigation model for the Control Plane Console.
// Visibility rules encode the doctrine: viewers are read-only and never see the
// approval queue or enforcement controls; approvers see what their authority
// covers. Icons are referenced by key and resolved in the sidebar component.

export type Visibility = "all" | "authorities" | RoleId[]

export interface NavSubItem {
  title: string
  url: string
}

export interface NavGroup {
  title: string
  iconKey: string
  url?: string
  items?: NavSubItem[]
  visibility: Visibility
  /** Show a pending-count badge sourced from this key. */
  badgeKey?: "approvals-pending"
  /** Rendered but disabled with a "not yet available" note (status-honest). */
  disabledNote?: string
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Dashboard",
    iconKey: "dashboard",
    url: "/dashboard",
    visibility: "all",
  },
  {
    title: "Registry",
    iconKey: "registry",
    visibility: "all",
    items: [
      { title: "Agents", url: "/registry/agents" },
      { title: "Tools", url: "/registry/tools" },
      { title: "Governance matrix", url: "/registry/governance" },
      { title: "Interfaces", url: "/registry/interfaces" },
      { title: "Identity & authority", url: "/registry/identity" },
    ],
  },
  {
    title: "Policy",
    iconKey: "policy",
    visibility: "all",
    items: [
      { title: "Decision simulator", url: "/policy/simulator" },
      { title: "Gating reference", url: "/policy/reference" },
    ],
  },
  {
    title: "Approvals",
    iconKey: "approvals",
    url: "/approvals",
    visibility: "authorities",
    badgeKey: "approvals-pending",
  },
  {
    title: "Decisions & traces",
    iconKey: "decisions",
    visibility: "all",
    items: [
      { title: "Decision journal", url: "/decisions" },
      { title: "Explanation log", url: "/decisions/explanations" },
      { title: "Trace explorer", url: "/traces" },
    ],
  },
  {
    title: "Enforcement",
    iconKey: "enforcement",
    visibility: ["os_program_manager", "ai_governance_owner", "isms_owner", "director"],
    items: [
      { title: "Kill-switch", url: "/enforcement/kill-switch" },
      { title: "Escalations", url: "/enforcement/escalations" },
      { title: "Budget breakers", url: "/enforcement/budgets" },
    ],
  },
  {
    title: "Governance",
    iconKey: "governance",
    visibility: "all",
    items: [
      { title: "Drift findings", url: "/governance/drift" },
      { title: "Weak signals", url: "/governance/weak-signals" },
    ],
  },
]

export const DEFERRED_GROUPS: NavGroup[] = [
  {
    title: "Agent readiness",
    iconKey: "agents",
    visibility: "all",
    disabledNote: "Wave 2 — not yet available",
  },
  {
    title: "Digital twins",
    iconKey: "twins",
    visibility: "all",
    disabledNote: "Wave 3 — not yet available",
  },
]

export function canView(
  visibility: Visibility,
  ctx: { hasAuthorityCount: number; roleIds: RoleId[] },
): boolean {
  if (visibility === "all") return true
  if (visibility === "authorities") return ctx.hasAuthorityCount > 0
  return visibility.some((id) => ctx.roleIds.includes(id))
}
