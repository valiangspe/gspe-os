// Domain types for the GSPE OS Control Plane Console.
// These mirror the SRS contracts (Foundation + Wave 1). They describe MOCK data
// only — there is no backend yet — but the shapes are faithful so a real SDK can
// drop in later without UI churn. See GSPE_ControlPlane_SRS_Foundation.md.

// ── Classifications ──────────────────────────────────────────────────────────

/** Side-effect risk of an action (REQ glossary). */
export type ActionClass = "C0" | "C1" | "C2" | "C3" | "C4" | "C5"

/** What an agent may do (autonomy ladder). */
export type AutonomyLevel = "A0" | "A1" | "A2" | "A3" | "A4" | "A5"

/** Lifecycle of a governed object (REQ-RG-4). Order matters for honesty. */
export type ControlStatus =
  | "Proposed"
  | "Designed"
  | "Tested"
  | "Active"
  | "Suspended"
  | "Retired"

export type DataClassification =
  | "Public"
  | "Internal"
  | "Confidential"
  | "Restricted"

/** Approval authorities (REQ-ID-3). */
export type ApproverAuthority =
  | "FINANCE"
  | "SAFETY"
  | "CUSTOMER"
  | "ISO"
  | "AI_GOVERNANCE"
  | "DIRECTOR"

/** Policy verdict (Appendix A). */
export type PolicyOutcome = "ALLOW" | "REQUIRE_APPROVAL" | "DENY" | "DEGRADE"

/** Obligations the caller must honor (REQ-PE-17). */
export type Obligation =
  | "RECORD_DECISION"
  | "OBTAIN_APPROVAL"
  | "ATTACH_EVIDENCE"
  | "OPERATE_DEGRADED"

export type CheckId =
  | "authority"
  | "risk"
  | "tool"
  | "evidence"
  | "freshness"
  | "autonomy"
  | "cost"
  | "trace"

export type CheckStatus = "pass" | "fail" | "na"

// ── Identity & authority (Domain 1) ──────────────────────────────────────────

/** A platform role. Drives the role-aware console. */
export type RoleId =
  | "viewer"
  | "agent_owner"
  | "os_program_manager"
  | "ai_governance_owner"
  | "isms_owner"
  | "finance_approver"
  | "safety_approver"
  | "customer_approver"
  | "iso_approver"
  | "director"

export interface Role {
  id: RoleId
  label: string
  department: string
  /** Approval authorities this role holds (REQ-ID-3). */
  authorities: ApproverAuthority[]
}

export interface Principal {
  type: "user" | "agent"
  id: string
  name: string
  email?: string
  department: string
  roleIds: RoleId[]
}

/** An authority-matrix cell: (role, class, resourceType) -> verdict (REQ-ID-2). */
export type AuthorityVerdict = "permitted" | "approver-required" | "forbidden"

export interface AuthorityMatrixRow {
  roleId: RoleId
  resourceType: string
  /** Verdict per action class C0..C5. */
  byClass: Record<ActionClass, AuthorityVerdict>
}

// ── Registry (Domain 2) ───────────────────────────────────────────────────────

export interface AgentRecord {
  id: string
  name: string
  purpose: string
  owner: string
  autonomy: AutonomyLevel
  allowedTools: string[]
  status: ControlStatus
  version: string
  /** Reduced scope when Suspended via kill-switch. */
  reducedScope?: string
}

export interface ToolRecord {
  id: string
  name: string
  owner: string
  sideEffectClass: ActionClass
  inputSchema: string
  outputSchema: string
  idempotent: boolean
  reversibility: string
  permissionScope: string
  dataClassification: DataClassification
  rateLimit: string
  costClass: "low" | "medium" | "high"
  failureBehavior: string
  status: ControlStatus
  version: string
}

/** Governance matrix row (Appendix B) — versioned data owned by the Registry. */
export interface GovernanceMatrixRow {
  actionClass: ActionClass
  label: string
  maxAutonomyWithoutApproval: AutonomyLevel
  defaultHumanGate: string
  /** Authority required when the class mandates approval. */
  approverAuthority: ApproverAuthority | null
}

// ── Interface Contract Register (Domain 6) ─────────────────────────────────────

export type InterfaceHealth = "green" | "yellow" | "red"

export interface InterfaceContract {
  id: string
  source: string
  target: string
  deliverable: string
  format: string
  owner: string
  slaCadence: string
  health: InterfaceHealth
  lastHandoff: string
  changeNoticeDays: number
}

// ── Policy & Gating Engine (Domain 3) ─────────────────────────────────────────

export interface PolicyContext {
  key: string
  sourceId: string
  asOf: string // iso-8601
  ttlSeconds: number
}

export interface PolicyEvidence {
  type: string
  ref: string
}

export interface PolicyDecisionRequest {
  traceId: string
  idempotencyKey: string
  principal: {
    type: "user" | "agent"
    id: string
    agentVersion?: string
    autonomyLevel?: AutonomyLevel
  }
  sourceApplication: string
  workflow?: string
  action: {
    type: string
    declaredClass?: ActionClass
    resource: { type: string; id: string }
  }
  tool?: { id?: string; sideEffectClass?: ActionClass }
  context: PolicyContext[]
  evidence: PolicyEvidence[]
  dataClassification?: DataClassification
  untrustedContentPresent: boolean
  policyVersionPin?: string
}

export interface ArtefactCheck {
  id: CheckId
  label: string
  status: CheckStatus
  rule: string
  detail: string
}

export interface PolicyDecision {
  decisionId: string
  traceId: string
  outcome: PolicyOutcome
  resolvedActionClass: ActionClass
  requiredApproverAuthority: ApproverAuthority | null
  obligations: Obligation[]
  checks: ArtefactCheck[]
  policyRulesetVersion: string
  matrixVersion: string
  evaluatedAtUtc: string
  latencyMs: number
}

// ── HITL Approval Queue (Domain 10) ───────────────────────────────────────────

export type ApprovalState =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "escalated"

export interface ApprovalEvidenceField {
  label: string
  value: string
}

export interface ApprovalItem {
  id: string
  decisionId: string
  traceId: string
  action: string
  resource: string
  principalName: string
  principalType: "user" | "agent"
  riskClass: ActionClass
  requestedAutonomy: AutonomyLevel | null
  requiredAuthority: ApproverAuthority
  state: ApprovalState
  createdAt: string
  deadline: string
  /** Fail-closed on timeout (C4/C5 always). */
  failClosed: boolean
  evidenceFields: ApprovalEvidenceField[]
  backupApprover?: string
  rejectionReason?: string
}

// ── Tracing & Decision Records (Domains 4, 5) ─────────────────────────────────

export interface TraceEvent {
  at: string
  label: string
  detail: string
  status?: CheckStatus | "info"
}

export interface TraceRecord {
  traceId: string
  principalName: string
  sourceApplication: string
  workflow: string
  resolvedActionClass: ActionClass
  autonomy: AutonomyLevel | null
  outcome: PolicyOutcome
  costTokens: number
  costUsd: number
  startedAt: string
  events: TraceEvent[]
  decisionId: string
  approvalId?: string
}

export interface DecisionRecord {
  decisionId: string
  traceId: string
  title: string
  decidedBy: string
  outcome: PolicyOutcome
  resolvedActionClass: ActionClass
  contextSnapshot: { key: string; value: string }[]
  explanationLogId: string
  approvalId?: string
  evidenceRefs: string[]
  outcomeReview?: string
  decidedAt: string
}

export interface ExplanationLog {
  id: string
  decisionId: string
  agent: string
  agentVersion: string
  promptConfigVersion: string
  toolCalls: string[]
  gateResults: { check: string; status: CheckStatus }[]
  uncertaintyFlags: string[]
  alternativesConsidered: string[]
}

// ── Kill-switch & Escalation (Domain 8) ───────────────────────────────────────

export type StopLevel = "none" | "soft" | "functional" | "hard"

export interface AgentStopState {
  agentId: string
  agentName: string
  owner: string
  stopLevel: StopLevel
  scope?: string
  reason?: string
  appliedBy?: string
  appliedAt?: string
  reinstatement?: {
    stage: string
    secondReviewerRequired: boolean
    secondReviewer?: string
  }
}

export interface EscalationEvent {
  id: string
  trigger: string
  agentName: string
  recommendedAction: string
  owner: string
  raisedAt: string
  resolved: boolean
}

// ── Budget & Circuit-Breaker (Domain 9) ───────────────────────────────────────

export type BudgetThresholdState = "ok" | "yellow" | "approval" | "suspended"

export interface BudgetRecord {
  id: string
  scope: "company" | "agent" | "module" | "department"
  name: string
  spentUsd: number
  limitUsd: number
  state: BudgetThresholdState
}

export interface BreakerEvent {
  id: string
  budgetName: string
  threshold: "80%" | "95%" | "100%" | "override"
  action: string
  at: string
}

// ── OS Health (Domain 13) ─────────────────────────────────────────────────────

export type MetricStatus = "green" | "yellow" | "red" | "na"

export interface HealthMetric {
  id: string
  label: string
  value: string
  status: MetricStatus
  owner: string
  cadence: string
  /** Assigned action when red/yellow (REQ-HM-2). */
  assignedAction?: string
  /** Console area the breach links to. */
  linkArea?: string
  trend?: { date: string; value: number }[]
}

// ── Drift (Domain 11) ─────────────────────────────────────────────────────────

export interface DriftFinding {
  id: string
  claim: string
  evidenceGap: string
  affectedObject: string
  owner: string
  responseAction: string
  resolved: boolean
  detectedAt: string
}

// ── Weak-signal (Domain 12) ────────────────────────────────────────────────────

export type WeakSignalClassification = "decision" | "monitor" | "deferred" | "none"

export interface WeakSignal {
  id: string
  source: string
  summary: string
  affectedArea: string
  potentialImpact: string
  owner: string
  proposedAction: string
  classification: WeakSignalClassification
  outcome90Day?: string
  deprioritized: boolean
}
