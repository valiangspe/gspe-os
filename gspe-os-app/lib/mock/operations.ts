import type {
  AgentStopState,
  ApprovalItem,
  BreakerEvent,
  BudgetRecord,
  DecisionRecord,
  DriftFinding,
  EscalationEvent,
  ExplanationLog,
  HealthMetric,
  TraceRecord,
  WeakSignal,
} from "./types"

// Wave 1 operational mock data: Approvals (10), Traces/Decisions (4,5),
// Kill-switch (8), Budgets (9), Health (13), Drift (11), Weak-signal (12).

// ── HITL Approval queue (Domain 10) ───────────────────────────────────────────

export const APPROVALS: ApprovalItem[] = [
  {
    id: "ap-1001",
    decisionId: "d-3f9a21b0",
    traceId: "tr-9a01",
    action: "Approve invoice INV-20451 (Rp 482,000,000)",
    resource: "invoice:INV-20451",
    principalName: "Finance Reconciler",
    principalType: "agent",
    riskClass: "C4",
    requestedAutonomy: "A2",
    requiredAuthority: "FINANCE",
    state: "pending",
    createdAt: "2026-06-02T09:15:00Z",
    deadline: "2026-06-02T13:15:00Z",
    failClosed: true,
    evidenceFields: [
      { label: "PO match", value: "PO-8841 matched, 3-way OK" },
      { label: "Budget line", value: "CAPEX-2026-Q2 within limit" },
      { label: "Vendor status", value: "Verified, no sanctions hit" },
    ],
    backupApprover: "Director",
  },
  {
    id: "ap-1002",
    decisionId: "d-7c2188af",
    traceId: "tr-9a02",
    action: "Send customer proposal email to PT Maju Bersama",
    resource: "customer-comm:CC-3320",
    principalName: "CRM Responder",
    principalType: "agent",
    riskClass: "C3",
    requestedAutonomy: "A1",
    requiredAuthority: "CUSTOMER",
    state: "pending",
    createdAt: "2026-06-02T10:02:00Z",
    deadline: "2026-06-02T18:02:00Z",
    failClosed: false,
    evidenceFields: [
      { label: "Pricing", value: "Matches approved rate card v12" },
      { label: "Legal terms", value: "Standard MSA, no redlines" },
    ],
  },
  {
    id: "ap-1003",
    decisionId: "d-1b55c0d2",
    traceId: "tr-9a03",
    action: "Issue safety work permit for Bay 4 hot work",
    resource: "work-permit:WP-7781",
    principalName: "Andi (HSE Officer)",
    principalType: "user",
    riskClass: "C5",
    requestedAutonomy: null,
    requiredAuthority: "SAFETY",
    state: "escalated",
    createdAt: "2026-06-02T07:30:00Z",
    deadline: "2026-06-02T08:30:00Z",
    failClosed: true,
    evidenceFields: [
      { label: "Gas test", value: "LEL 0%, last reading 07:10" },
      { label: "Fire watch", value: "Assigned: 2 personnel" },
      { label: "Isolation", value: "LOTO verified" },
    ],
    backupApprover: "Director",
  },
  {
    id: "ap-1004",
    decisionId: "d-9904ab1c",
    traceId: "tr-9a04",
    action: "Finalize work order WO-5521 release",
    resource: "work-order:WO-5521",
    principalName: "PPC Planner Agent",
    principalType: "agent",
    riskClass: "C2",
    requestedAutonomy: "A2",
    requiredAuthority: "ISO",
    state: "pending",
    createdAt: "2026-06-02T11:05:00Z",
    deadline: "2026-06-03T11:05:00Z",
    failClosed: false,
    evidenceFields: [
      { label: "BOM freshness", value: "asOf 11:00, TTL 1h — fresh" },
      { label: "Stock readiness", value: "All lines available" },
    ],
  },
]

// ── Tracing (Domain 4) + Decision records (Domain 5) ──────────────────────────

export const TRACES: TraceRecord[] = [
  {
    traceId: "tr-9a04",
    principalName: "PPC Planner Agent",
    sourceApplication: "PPC",
    workflow: "work-order-release",
    resolvedActionClass: "C2",
    autonomy: "A2",
    outcome: "REQUIRE_APPROVAL",
    costTokens: 1840,
    costUsd: 0.04,
    startedAt: "2026-06-02T11:05:00Z",
    decisionId: "d-9904ab1c",
    approvalId: "ap-1004",
    events: [
      { at: "11:05:00", label: "Trace started", detail: "PPC requests WO-5521 release", status: "info" },
      { at: "11:05:00", label: "Authority", detail: "Agent — autonomy gate applies", status: "na" },
      { at: "11:05:01", label: "Risk", detail: "Resolved C2 (hard-to-undo write)", status: "pass" },
      { at: "11:05:01", label: "Tool", detail: "tool-wo-release allowed & class-consistent", status: "pass" },
      { at: "11:05:01", label: "Freshness", detail: "BOM asOf 11:00, TTL 1h — fresh", status: "pass" },
      { at: "11:05:01", label: "Autonomy", detail: "A2 within A3 ceiling for C2", status: "pass" },
      { at: "11:05:01", label: "Decision", detail: "REQUIRE_APPROVAL (ISO authority)", status: "info" },
    ],
  },
  {
    traceId: "tr-9a01",
    principalName: "Finance Reconciler",
    sourceApplication: "Finance",
    workflow: "invoice-approval",
    resolvedActionClass: "C4",
    autonomy: "A2",
    outcome: "REQUIRE_APPROVAL",
    costTokens: 2200,
    costUsd: 0.05,
    startedAt: "2026-06-02T09:15:00Z",
    decisionId: "d-3f9a21b0",
    approvalId: "ap-1001",
    events: [
      { at: "09:15:00", label: "Trace started", detail: "Invoice INV-20451 approval prepared", status: "info" },
      { at: "09:15:01", label: "Risk", detail: "Resolved C4 (financial)", status: "pass" },
      { at: "09:15:01", label: "Autonomy", detail: "A2 within C4 ceiling (A2); A3+ would DENY", status: "pass" },
      { at: "09:15:01", label: "Decision", detail: "REQUIRE_APPROVAL (FINANCE authority)", status: "info" },
    ],
  },
  {
    traceId: "tr-9a07",
    principalName: "Schedule Optimizer",
    sourceApplication: "PPC",
    workflow: "schedule-optimize",
    resolvedActionClass: "C2",
    autonomy: "A3",
    outcome: "DENY",
    costTokens: 9100,
    costUsd: 0.19,
    startedAt: "2026-06-01T22:40:00Z",
    decisionId: "d-aa17ff20",
    events: [
      { at: "22:40:00", label: "Trace started", detail: "Repeated WO release attempts detected", status: "info" },
      { at: "22:40:01", label: "Autonomy", detail: "Runaway loop — agent suspended", status: "fail" },
      { at: "22:40:01", label: "Decision", detail: "DENY — agent Suspended via kill-switch", status: "fail" },
    ],
  },
]

export const DECISIONS: DecisionRecord[] = [
  {
    decisionId: "d-9904ab1c",
    traceId: "tr-9a04",
    title: "WO-5521 release routed for approval",
    decidedBy: "Policy engine",
    outcome: "REQUIRE_APPROVAL",
    resolvedActionClass: "C2",
    contextSnapshot: [
      { key: "bom", value: "BOM-5521 asOf 2026-06-02T11:00Z" },
      { key: "stock", value: "All lines available" },
    ],
    explanationLogId: "ex-9904",
    approvalId: "ap-1004",
    evidenceRefs: ["BOM-5521", "stock-report-0602"],
    decidedAt: "2026-06-02T11:05:01Z",
  },
  {
    decisionId: "d-aa17ff20",
    traceId: "tr-9a07",
    title: "Schedule Optimizer denied after runaway loop",
    decidedBy: "Policy engine + Kill-switch",
    outcome: "DENY",
    resolvedActionClass: "C2",
    contextSnapshot: [{ key: "iteration", value: "cap exceeded (217 iterations)" }],
    explanationLogId: "ex-aa17",
    evidenceRefs: ["incident-INC-0042"],
    outcomeReview: "Root cause: unbounded retry on lock contention. Reinstatement pending regression eval.",
    decidedAt: "2026-06-01T22:40:01Z",
  },
]

export const EXPLANATIONS: ExplanationLog[] = [
  {
    id: "ex-9904",
    decisionId: "d-9904ab1c",
    agent: "PPC Planner Agent",
    agentVersion: "1.2.0",
    promptConfigVersion: "pc-2026.05",
    toolCalls: ["tool-bom-read", "tool-wo-release(prepare)"],
    gateResults: [
      { check: "risk", status: "pass" },
      { check: "tool", status: "pass" },
      { check: "freshness", status: "pass" },
      { check: "autonomy", status: "pass" },
    ],
    uncertaintyFlags: [],
    alternativesConsidered: ["Defer release to next shift", "Split into two WOs"],
  },
  {
    id: "ex-aa17",
    decisionId: "d-aa17ff20",
    agent: "Schedule Optimizer",
    agentVersion: "0.7.1",
    promptConfigVersion: "pc-2026.04",
    toolCalls: ["tool-wo-release(x217)"],
    gateResults: [{ check: "autonomy", status: "fail" }],
    uncertaintyFlags: ["loop-detected", "iteration-cap-exceeded"],
    alternativesConsidered: [],
  },
]

// ── Kill-switch & Escalation (Domain 8) ───────────────────────────────────────

export const STOP_STATES: AgentStopState[] = [
  { agentId: "agent-ppc-planner", agentName: "PPC Planner Agent", owner: "Fitri Handayani", stopLevel: "none" },
  { agentId: "agent-proc-assist", agentName: "Procurement Assistant", owner: "Fitri Handayani", stopLevel: "none" },
  { agentId: "agent-crm-responder", agentName: "CRM Responder", owner: "Agus Wijaya", stopLevel: "none" },
  { agentId: "agent-fin-reconciler", agentName: "Finance Reconciler", owner: "Anita Rahmawati", stopLevel: "none" },
  {
    agentId: "agent-rogue-optimizer",
    agentName: "Schedule Optimizer",
    owner: "Fitri Handayani",
    stopLevel: "hard",
    scope: "Fully suspended",
    reason: "Runaway loop — 217 WO release attempts",
    appliedBy: "AI Governance Owner",
    appliedAt: "2026-06-01T22:41:00Z",
    reinstatement: {
      stage: "Awaiting regression eval evidence",
      secondReviewerRequired: true,
      secondReviewer: "Director",
    },
  },
]

export const ESCALATIONS: EscalationEvent[] = [
  {
    id: "esc-01",
    trigger: "Detected agent loop",
    agentName: "Schedule Optimizer",
    recommendedAction: "Functional/Hard stop",
    owner: "AI Governance Owner",
    raisedAt: "2026-06-01T22:40:30Z",
    resolved: true,
  },
  {
    id: "esc-02",
    trigger: "Cost-budget breach (95%)",
    agentName: "Procurement Assistant",
    recommendedAction: "Approval required for non-routine LLM calls",
    owner: "OS Program Manager",
    raisedAt: "2026-06-02T08:55:00Z",
    resolved: false,
  },
  {
    id: "esc-03",
    trigger: "Unauthorized C4 action attempt",
    agentName: "Finance Reconciler",
    recommendedAction: "Soft stop + review",
    owner: "AI Governance Owner",
    raisedAt: "2026-06-02T09:20:00Z",
    resolved: false,
  },
]

// ── Budget & Circuit-Breaker (Domain 9) ───────────────────────────────────────

export const BUDGETS: BudgetRecord[] = [
  { id: "bud-co", scope: "company", name: "GSPE OS — Company", spentUsd: 6120, limitUsd: 10000, state: "yellow" },
  { id: "bud-ppc", scope: "module", name: "PPC Module", spentUsd: 1480, limitUsd: 2000, state: "yellow" },
  { id: "bud-proc", scope: "agent", name: "Procurement Assistant", spentUsd: 1910, limitUsd: 2000, state: "approval" },
  { id: "bud-fin", scope: "department", name: "Finance Dept", spentUsd: 540, limitUsd: 3000, state: "ok" },
  { id: "bud-opt", scope: "agent", name: "Schedule Optimizer", spentUsd: 2000, limitUsd: 2000, state: "suspended" },
]

export const BREAKER_EVENTS: BreakerEvent[] = [
  { id: "br-1", budgetName: "Procurement Assistant", threshold: "95%", action: "Approval required for non-routine LLM calls", at: "2026-06-02T08:55:00Z" },
  { id: "br-2", budgetName: "Schedule Optimizer", threshold: "100%", action: "Non-deterministic agent suspended", at: "2026-06-01T22:41:00Z" },
  { id: "br-3", budgetName: "PPC Module", threshold: "80%", action: "Yellow alert to OS PM + Agent Owner", at: "2026-06-02T07:00:00Z" },
]

// ── OS Health (Domain 13) ──────────────────────────────────────────────────────

const trend = (vals: number[]) =>
  vals.map((value, i) => ({ date: `2026-05-${(24 + i).toString().padStart(2, "0")}`, value }))

export const HEALTH_METRICS: HealthMetric[] = [
  { id: "hm-accept", label: "Recommendation acceptance rate", value: "78%", status: "green", owner: "AI Governance Owner", cadence: "Weekly", trend: trend([71, 73, 70, 75, 77, 76, 78]) },
  { id: "hm-override", label: "Override rate", value: "12%", status: "yellow", owner: "AI Governance Owner", cadence: "Weekly", assignedAction: "Review prompts for high-override workflows", linkArea: "/governance", trend: trend([8, 9, 11, 10, 13, 12, 12]) },
  { id: "hm-escalation", label: "Escalation frequency", value: "3 / week", status: "yellow", owner: "OS Program Manager", cadence: "Weekly", assignedAction: "Triage open escalations", linkArea: "/enforcement", trend: trend([1, 2, 1, 2, 3, 2, 3]) },
  { id: "hm-mttk", label: "Mean time to kill", value: "42 s", status: "green", owner: "ISMS Owner", cadence: "Per incident", trend: trend([90, 75, 60, 55, 48, 45, 42]) },
  { id: "hm-cost", label: "Cost per decision", value: "$0.04", status: "green", owner: "OS Program Manager", cadence: "Daily", trend: trend([0.06, 0.05, 0.05, 0.05, 0.04, 0.04, 0.04]) },
  { id: "hm-sla", label: "Interface SLA adherence", value: "88%", status: "yellow", owner: "OS Program Manager", cadence: "Daily", assignedAction: "Chase red interface: Procurement→Finance", linkArea: "/registry/interfaces", trend: trend([95, 93, 90, 91, 89, 88, 88]) },
  { id: "hm-hitl", label: "HITL queue latency", value: "2.1 h", status: "green", owner: "OS Program Manager", cadence: "Daily", trend: trend([3.2, 2.9, 2.6, 2.4, 2.3, 2.2, 2.1]) },
  { id: "hm-awo", label: "Approve-without-override rate", value: "94%", status: "red", owner: "AI Governance Owner", cadence: "Weekly", assignedAction: "Possible rubber-stamping — audit approvals", linkArea: "/approvals", trend: trend([80, 84, 88, 90, 92, 93, 94]) },
  { id: "hm-incident", label: "Incident / near-miss count", value: "1", status: "yellow", owner: "ISMS Owner", cadence: "Per incident", assignedAction: "Close out INC-0042 reinstatement", linkArea: "/enforcement", trend: trend([0, 0, 1, 0, 0, 1, 1]) },
  { id: "hm-eval", label: "Eval pass rate", value: "—", status: "na", owner: "AI Governance Owner", cadence: "Per release", assignedAction: "Not yet available (Wave 2, Domain 14)" },
  { id: "hm-twin", label: "Twin fidelity error", value: "—", status: "na", owner: "OS Program Manager", cadence: "Per twin", assignedAction: "Not yet available (Wave 3, Domain 16)" },
]

// ── Drift (Domain 11) ───────────────────────────────────────────────────────────

export const DRIFT_FINDINGS: DriftFinding[] = [
  {
    id: "df-01",
    claim: '"Schedule Optimizer is autonomous"',
    evidenceGap: "Agent is Suspended; no tested kill-switch reinstatement, no approved A-level.",
    affectedObject: "agent-rogue-optimizer",
    owner: "AI Governance Owner",
    responseAction: "Downgrade wording to 'experimental'; mark Designed.",
    resolved: false,
    detectedAt: "2026-06-01T23:00:00Z",
  },
  {
    id: "df-02",
    claim: '"Finance Reconciler is Active in production"',
    evidenceGap: "Registry status is Designed — no real execution evidence (REQ-SC-16).",
    affectedObject: "agent-fin-reconciler",
    owner: "OS Program Manager",
    responseAction: "Correct proposal deck; status remains Designed.",
    resolved: false,
    detectedAt: "2026-05-30T14:00:00Z",
  },
  {
    id: "df-03",
    claim: '"Real-time PPC→Production interface"',
    evidenceGap: "Measured latency meets <5 min — claim supported.",
    affectedObject: "if-ppc-prod",
    owner: "OS Program Manager",
    responseAction: "No action — claim matches evidence.",
    resolved: true,
    detectedAt: "2026-05-28T09:00:00Z",
  },
]

// ── Weak-signal (Domain 12) ──────────────────────────────────────────────────────

export const WEAK_SIGNALS: WeakSignal[] = [
  {
    id: "ws-01",
    source: "Vendor newsletter",
    summary: "Lead times for steel plate creeping up in SE Asia.",
    affectedArea: "Procurement",
    potentialImpact: "WO release delays for fabricated parts",
    owner: "Procurement Lead",
    proposedAction: "Add 2-week buffer to steel-plate POs; monitor.",
    classification: "monitor",
    deprioritized: false,
  },
  {
    id: "ws-02",
    source: "Customer support tickets",
    summary: "Repeated questions about proposal turnaround time.",
    affectedArea: "Sales",
    potentialImpact: "Deal slippage if response SLA missed",
    owner: "Sales Ops",
    proposedAction: "Pilot CRM Responder for first-draft replies.",
    classification: "decision",
    outcome90Day: "Pilot launched; 30% faster first response.",
    deprioritized: false,
  },
  {
    id: "ws-03",
    source: "Industry blog",
    summary: "Speculative AI regulation chatter.",
    affectedArea: "Governance",
    potentialImpact: "Unclear; no concrete trigger",
    owner: "AI Governance Owner",
    proposedAction: "None — no decision in 3 cycles.",
    classification: "none",
    deprioritized: true,
  },
]
