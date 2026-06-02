// Deterministic A.R.T.E.F.A.C.T. policy engine (Domain 3).
//
// This is a faithful, pure, side-effect-free implementation of the eight gates
// described in GSPE_ControlPlane_SRS_Foundation.md §4.3. It runs entirely in the
// browser against the mock registry/identity/governance-matrix so the Policy
// console's decision simulator produces real verdicts — same input always
// yields the same output (REQ-PE-3).

import { AGENTS, GOVERNANCE_MATRIX, MATRIX_VERSION, POLICY_RULESET_VERSION, TOOLS } from "./mock/registry"
import { AUTHORITY_MATRIX, PRINCIPALS, ROLES } from "./mock/identity"
import type {
  ActionClass,
  ArtefactCheck,
  AutonomyLevel,
  Obligation,
  PolicyDecision,
  PolicyDecisionRequest,
} from "./mock/types"

const CLASS_RANK: Record<ActionClass, number> = {
  C0: 0,
  C1: 1,
  C2: 2,
  C3: 3,
  C4: 4,
  C5: 5,
}

const AUTONOMY_RANK: Record<AutonomyLevel, number> = {
  A0: 0,
  A1: 1,
  A2: 2,
  A3: 3,
  A4: 4,
  A5: 5,
}

/** Heuristic class resolution from action type when no class is declared. */
function inferClassFromAction(actionType: string): ActionClass {
  const t = actionType.toLowerCase()
  if (/(approve|pay|invoice|payment|financ)/.test(t)) return "C4"
  if (/(safety|permit|hazard|lockout)/.test(t)) return "C5"
  if (/(email|notify|send|publish|message)/.test(t)) return "C3"
  if (/(release|finalize|commit|delete|cancel)/.test(t)) return "C2"
  if (/(update|edit|draft|create)/.test(t)) return "C1"
  return "C0"
}

function higher(a: ActionClass, b: ActionClass): ActionClass {
  return CLASS_RANK[a] >= CLASS_RANK[b] ? a : b
}

// Tiny deterministic id from the trace + action (no Date.now / random — stable).
function deriveDecisionId(req: PolicyDecisionRequest): string {
  const seed = `${req.traceId}|${req.action.type}|${req.principal.id}`
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return `d-${(h >>> 0).toString(16).padStart(8, "0")}`
}

export function evaluatePolicy(req: PolicyDecisionRequest): PolicyDecision {
  const checks: ArtefactCheck[] = []
  const obligations = new Set<Obligation>()
  let requiredApproverAuthority: PolicyDecision["requiredApproverAuthority"] = null

  // Track the verdict by severity rank to avoid closure type-narrowing issues.
  const RANK = { ALLOW: 0, DEGRADE: 1, REQUIRE_APPROVAL: 2, DENY: 3 } as const
  const OUTCOMES = ["ALLOW", "DEGRADE", "REQUIRE_APPROVAL", "DENY"] as const
  let outcomeRank = 0
  const escalate = (next: PolicyDecision["outcome"]) => {
    if (RANK[next] > outcomeRank) outcomeRank = RANK[next]
  }
  const currentOutcome = (): PolicyDecision["outcome"] => OUTCOMES[outcomeRank]

  // ── T (Trace) — checked first because no-trace is an immediate DENY. ────────
  const hasTrace = Boolean(req.traceId && req.traceId.trim())

  // ── R (Risk) — resolve & validate class; escalate on mismatch (REQ-PE-5). ──
  const inferred = inferClassFromAction(req.action.type)
  const resolved = req.action.declaredClass
    ? higher(req.action.declaredClass, inferred)
    : inferred
  const escalated = req.action.declaredClass && resolved !== req.action.declaredClass

  // Short-circuit no-trace per REQ-PE-4.
  if (!hasTrace) {
    checks.push({
      id: "trace",
      label: "Trace",
      status: "fail",
      rule: "REQ-PE-4",
      detail: "No traceId present — request is invalid for any gated action.",
    })
    return finalize(req, "DENY", resolved, null, [], checks)
  }

  const gov = GOVERNANCE_MATRIX.find((g) => g.actionClass === resolved)!
  const agent =
    req.principal.type === "agent"
      ? AGENTS.find((a) => a.id === req.principal.id)
      : undefined
  const autonomy: AutonomyLevel | undefined =
    req.principal.autonomyLevel ?? agent?.autonomy

  // ── A (Authority) ──────────────────────────────────────────────────────────
  const resourceType = req.action.resource.type
  const authRows = AUTHORITY_MATRIX.filter(
    (r) => r.resourceType === resourceType || r.resourceType === "*",
  )
  const verdicts = authRows.map((r) => r.byClass[resolved])
  let authStatus: ArtefactCheck["status"] = "na"
  let authDetail = "No authority rule matched the principal — treated as not permitted."
  if (req.principal.type === "agent") {
    authStatus = "na"
    authDetail = "Agent principal — authority resolved via autonomy gate."
  } else if (verdicts.includes("permitted")) {
    authStatus = "pass"
    authDetail = `Role is permitted for ${resolved} on ${resourceType}.`
  } else if (verdicts.includes("approver-required")) {
    authStatus = "pass"
    authDetail = `Role may act on ${resolved} only with approval.`
    escalate("REQUIRE_APPROVAL")
  } else {
    authStatus = "fail"
    escalate("DENY")
  }
  checks.push({
    id: "authority",
    label: "Authority",
    status: authStatus,
    rule: "REQ-ID-2 / REQ-PE-1",
    detail: authDetail,
  })

  // ── R (Risk) check row ─────────────────────────────────────────────────────
  checks.push({
    id: "risk",
    label: "Risk class",
    status: "pass",
    rule: "REQ-PE-5",
    detail: escalated
      ? `Declared ${req.action.declaredClass} escalated to ${resolved} (engine never trusts a lower declared class).`
      : `Resolved action class ${resolved} (${gov.label}).`,
  })

  // ── T (Tool permission) ────────────────────────────────────────────────────
  if (req.tool?.id) {
    const tool = TOOLS.find((t) => t.id === req.tool!.id)
    const inAllowList = agent ? agent.allowedTools.includes(req.tool.id) : true
    const toolClass = tool?.sideEffectClass ?? req.tool.sideEffectClass ?? "C0"
    if (!tool) {
      checks.push(toolFail(`Tool ${req.tool.id} is not registered (no use before registration).`))
      escalate("DENY")
    } else if (agent && !inAllowList) {
      checks.push(toolFail(`Tool ${tool.name} is not in ${agent.name}'s allow-list.`))
      escalate("DENY")
    } else if (CLASS_RANK[toolClass] > CLASS_RANK[resolved]) {
      checks.push(toolFail(`Tool side-effect class ${toolClass} exceeds resolved class ${resolved}.`))
      escalate("DENY")
    } else {
      checks.push({
        id: "tool",
        label: "Tool permission",
        status: "pass",
        rule: "REQ-PE-8",
        detail: `Tool ${tool.name} is allowed and class-consistent (${toolClass}).`,
      })
    }
  } else {
    checks.push({
      id: "tool",
      label: "Tool permission",
      status: "na",
      rule: "REQ-PE-8",
      detail: "No tool specified for this action.",
    })
  }

  // ── E (Evidence) — required for C2+ per policy. ────────────────────────────
  const evidenceRequired = CLASS_RANK[resolved] >= CLASS_RANK["C2"]
  if (evidenceRequired && req.evidence.length === 0) {
    checks.push({
      id: "evidence",
      label: "Evidence",
      status: "fail",
      rule: "REQ-PE-11",
      detail: `Class ${resolved} requires supporting evidence; none attached.`,
    })
    obligations.add("ATTACH_EVIDENCE")
    escalate("REQUIRE_APPROVAL")
  } else {
    checks.push({
      id: "evidence",
      label: "Evidence",
      status: evidenceRequired ? "pass" : "na",
      rule: "REQ-PE-11",
      detail: evidenceRequired
        ? `${req.evidence.length} evidence item(s) attached.`
        : "Evidence not required for this class.",
    })
  }

  // ── F (Freshness) — context within TTL? ────────────────────────────────────
  const now = referenceNow()
  const stale = req.context.filter((c) => {
    const asOf = Date.parse(c.asOf)
    if (Number.isNaN(asOf)) return false
    return (now - asOf) / 1000 > c.ttlSeconds
  })
  if (req.context.length === 0) {
    checks.push({
      id: "freshness",
      label: "Freshness",
      status: "na",
      rule: "REQ-PE-12",
      detail: "No context items declared.",
    })
  } else if (stale.length > 0) {
    checks.push({
      id: "freshness",
      label: "Freshness",
      status: "fail",
      rule: "REQ-PE-12",
      detail: `Stale context past TTL: ${stale.map((s) => s.key).join(", ")}.`,
    })
    escalate(CLASS_RANK[resolved] >= CLASS_RANK["C2"] ? "REQUIRE_APPROVAL" : "DEGRADE")
  } else {
    checks.push({
      id: "freshness",
      label: "Freshness",
      status: "pass",
      rule: "REQ-PE-12",
      detail: `All ${req.context.length} context item(s) within TTL.`,
    })
  }

  // ── Injection gate (REQ-PE-13) — folds into autonomy/tool. ─────────────────
  if (req.untrustedContentPresent && CLASS_RANK[resolved] >= CLASS_RANK["C2"]) {
    checks.push({
      id: "tool",
      label: "Injection guard",
      status: "fail",
      rule: "REQ-PE-13",
      detail: "Untrusted content present — C2+ tool action requires approval, no escalation allowed.",
    })
    escalate("REQUIRE_APPROVAL")
  }

  // ── A (Autonomy) — agent A-level ≤ ceiling for the class. ──────────────────
  if (req.principal.type === "agent" && autonomy) {
    const ceilingRank = AUTONOMY_RANK[gov.maxAutonomyWithoutApproval]
    const agentRank = AUTONOMY_RANK[autonomy]
    // Hard rule REQ-PE-9: C4/C5 never ALLOW for agent at autonomy >= A3.
    const hardClass = resolved === "C4" || resolved === "C5"
    if (hardClass && agentRank >= AUTONOMY_RANK["A3"]) {
      checks.push({
        id: "autonomy",
        label: "Autonomy",
        status: "fail",
        rule: "REQ-PE-9",
        detail: `Hard rule: agent at ${autonomy} may NEVER autonomously execute ${resolved}. DENY.`,
      })
      escalate("DENY")
    } else if (agentRank > ceilingRank) {
      checks.push({
        id: "autonomy",
        label: "Autonomy",
        status: "fail",
        rule: "REQ-PE-7",
        detail: `Agent ${autonomy} exceeds ${gov.maxAutonomyWithoutApproval} ceiling for ${resolved}.`,
      })
      escalate(hardClass ? "DENY" : "REQUIRE_APPROVAL")
    } else {
      checks.push({
        id: "autonomy",
        label: "Autonomy",
        status: "pass",
        rule: "REQ-PE-7",
        detail: `Agent ${autonomy} within ${gov.maxAutonomyWithoutApproval} ceiling for ${resolved}.`,
      })
    }
  } else {
    checks.push({
      id: "autonomy",
      label: "Autonomy",
      status: "na",
      rule: "REQ-PE-7",
      detail: "User principal — autonomy ceiling does not apply.",
    })
  }

  // ── Data classification gate (REQ-PE-14). ──────────────────────────────────
  // Restricted data requires an elevated role: a security owner / director, or a
  // role that holds an approval authority. A general read permission is not
  // enough to touch Restricted data.
  if (req.dataClassification === "Restricted" && req.principal.type === "user") {
    const p = PRINCIPALS.find((x) => x.id === req.principal.id)
    const roleAuthorities = p
      ? p.roleIds.flatMap((r) => ROLES[r].authorities)
      : []
    const elevated =
      !!p &&
      (p.roleIds.some((r) => r === "director" || r === "isms_owner") ||
        roleAuthorities.length > 0)
    if (!elevated) {
      checks.push({
        id: "authority",
        label: "Data classification",
        status: "fail",
        rule: "REQ-PE-14",
        detail: "Restricted data accessed by a role not authorized for it. DENY.",
      })
      escalate("DENY")
    }
  }

  // ── Default human gate from the governance matrix (REQ-PE-10). ─────────────
  // For C2+ the class carries a required approver authority. An agent may never
  // self-clear such an action — if it is not already denied, it routes for
  // approval. A user routes for approval too, unless the authority matrix
  // explicitly permits that role for the class (an authorized human can act).
  if (gov.approverAuthority && CLASS_RANK[resolved] >= CLASS_RANK["C2"]) {
    if (currentOutcome() !== "DENY") {
      const explicitlyPermitted =
        req.principal.type === "user" &&
        authRows.some((r) => r.byClass[resolved] === "permitted")
      if (!explicitlyPermitted) {
        escalate("REQUIRE_APPROVAL")
        requiredApproverAuthority = gov.approverAuthority
      }
    }
  }

  // ── C (Cost) — Budget port; Foundation stub returns "available". ───────────
  checks.push({
    id: "cost",
    label: "Cost",
    status: "pass",
    rule: "REQ-PE-15",
    detail: "Budget port (stub): budget available. Real breaker plugs in at Wave 1.",
  })

  // ── T (Trace) — present. ───────────────────────────────────────────────────
  checks.push({
    id: "trace",
    label: "Trace",
    status: "pass",
    rule: "REQ-PE-4",
    detail: `traceId ${req.traceId} present.`,
  })

  // Obligations.
  const outcome = currentOutcome()
  obligations.add("RECORD_DECISION")
  if (outcome === "REQUIRE_APPROVAL") obligations.add("OBTAIN_APPROVAL")
  if (outcome === "DEGRADE") obligations.add("OPERATE_DEGRADED")
  if (outcome === "REQUIRE_APPROVAL" && requiredApproverAuthority == null) {
    requiredApproverAuthority = gov.approverAuthority ?? "DIRECTOR"
  }
  if (outcome === "ALLOW" || outcome === "DENY") {
    requiredApproverAuthority = null
  }

  return finalize(req, outcome, resolved, requiredApproverAuthority, [...obligations], orderChecks(checks))
}

function toolFail(detail: string): ArtefactCheck {
  return { id: "tool", label: "Tool permission", status: "fail", rule: "REQ-PE-8", detail }
}

// Fixed evaluation clock so freshness is deterministic and reproducible across
// reloads (no Date.now). Mock context items declare asOf relative to this.
export const EVAL_NOW_ISO = "2026-06-02T12:00:00Z"

function referenceNow(): number {
  return Date.parse(EVAL_NOW_ISO)
}

// Keep one row per check id, in canonical A R T E F A C T order, preferring fails.
function orderChecks(checks: ArtefactCheck[]): ArtefactCheck[] {
  const order: ArtefactCheck["id"][] = [
    "authority",
    "risk",
    "tool",
    "evidence",
    "freshness",
    "autonomy",
    "cost",
    "trace",
  ]
  return order.map((id) => {
    const rows = checks.filter((c) => c.id === id)
    return rows.find((r) => r.status === "fail") ?? rows[0]
  }).filter(Boolean) as ArtefactCheck[]
}

function finalize(
  req: PolicyDecisionRequest,
  outcome: PolicyDecision["outcome"],
  resolvedActionClass: ActionClass,
  requiredApproverAuthority: PolicyDecision["requiredApproverAuthority"],
  obligations: Obligation[],
  checks: ArtefactCheck[],
): PolicyDecision {
  return {
    decisionId: deriveDecisionId(req),
    traceId: req.traceId,
    outcome,
    resolvedActionClass,
    requiredApproverAuthority,
    obligations,
    checks,
    policyRulesetVersion: POLICY_RULESET_VERSION,
    matrixVersion: MATRIX_VERSION,
    evaluatedAtUtc: "2026-06-02T12:00:00Z",
    latencyMs: 7,
  }
}
