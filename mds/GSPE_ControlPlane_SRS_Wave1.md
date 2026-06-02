# SRS Extension — GSPE OS Control Plane Platform

## Wave 1: Enforcement Domains (8–13)

**Status:** Extension to `GSPE_ControlPlane_SRS_Foundation.md`
**Relationship:** This document adds Part 5 to the SRS. **Part 1 (System Core) is unchanged and still binds** — every law, cross-cutting requirement, and the production-honesty rule (REQ-SC-16) apply here without restatement. Domains are numbered to match their domain ID (Domain 8 = §8).

> **What Wave 1 activates.** Phase 0 defined `IBudgetPort` and `IApprovalPort` as stubs. Wave 1 makes them real: the Policy engine's cost gate (REQ-PE-15) now gets real budget results, and the SDK's `RequestApproval` (REQ-SDK-1) now routes to a real queue — both **without any change to the frozen contract**. That is the payoff of the ports-first design.

---

## Part 5 — Enforcement Wave Domain Requirements

### 5.0 New ports introduced
`IKillSwitchPort`, `IBudgetPort` (promoted from stub), `IApprovalPort` (promoted from stub), `IDriftPort`, `IWeakSignalPort`, `IHealthPort`. All cross-domain access remains ports-only (REQ-SC-3).

### 5.0.1 MVP-critical subset
Four of the six Wave-1 domains complete the v3.6 11-domain MVP: **8 Kill-switch, 9 Budget, 10 HITL queue, 13 Health dashboard.** Domains **11 Drift** and **12 Weak-signal** are Wave 1 but may be built immediately after the MVP subset. A Phase 3 build prompt should prioritize 8 → 9 → 10 → 13, then 11 → 12.

---

## 8. Domain 8 — Kill-Switch & Escalation Service

### 8.1 Purpose
Implement soft / functional / hard stop as a real state machine, plus the escalation protocol and the reinstatement workflow. This is the control that makes agentic operation safe enough to scale.

### 8.2 Functional requirements
REQ-KS-1. The service SHALL implement three stop levels as a state machine: **Soft Stop** (agent reduced to A0 — may read, may not recommend), **Functional Stop** (agent disabled for one workflow or tool), **Hard Stop** (agent fully suspended).
REQ-KS-2. Stop authority SHALL be enforced via Identity (Domain 1): Agent Owner → Soft; OS Program Manager → Soft/Functional; AI Governance Owner → Functional/Hard; ISMS Owner → Hard (security/data risk); Director → any level. An actor without the required authority SHALL be refused.
REQ-KS-3. The service SHALL accept **escalation events** (from monitoring, from the Policy boundary, or manually reported) and route each per the escalation protocol: trigger → action → owner. Triggers SHALL include at least: forbidden-tool/action attempt, repeated rejection, workflow confusion, cost-budget breach, restricted-data exposure, unauthorized C3/C4/C5 action, conflicting high-risk recommendations, detected agent loop, and injection/untrusted-content hijack.
REQ-KS-4. When an agent is stopped, the service SHALL update the **Registry control status** (Domain 2) to `Suspended` (or a reduced scope), and the Policy engine SHALL thereafter **DENY** any action outside the permitted reduced scope. (Integration: Policy reads agent status from Registry; a stopped agent cannot act.)
REQ-KS-5. The service SHALL enforce the **reinstatement workflow**: incident trigger → stop level assigned → owner notified → affected tools/workflows blocked → root cause recorded (Decision domain) → remediation completed → **regression eval passed** (Wave 2 Eval harness; until it exists, a recorded regression-test evidence link) → reinstatement approved → Registry status restored → audit retained. For safety/security stops, reinstatement approval SHALL require a **second reviewer** per segregation of duties (REQ-ID-4).
REQ-KS-6. The service SHALL accept **runaway signals** (iteration cap exceeded, runaway tool use) and auto-trigger at least a Functional Stop.
REQ-KS-7. The service SHALL support multi-agent safety: a detected agent loop or conflicting high-risk recommendations SHALL be able to suspend the involved agents.
REQ-KS-8. All stop and reinstatement events SHALL be append-only, traced (`traceId`), and linked to the incident and decision records.
REQ-KS-9. The service SHALL expose `IKillSwitchPort`: `RaiseEscalation(...)`, `ApplyStop(level, scope, authority)`, `RequestReinstatement(...)`, `GetAgentStopState(agentId)`.

### 8.3 Acceptance
Active only when the service has stopped a test agent or workflow in a controlled test and at least one real stop/reinstatement case is logged.

---

## 9. Domain 9 — Budget & Circuit-Breaker Service

### 9.1 Purpose
Prevent runaway AI/API/compute cost using **circuit breakers, not just alerts**, and make the Policy engine's cost gate real.

### 9.2 Functional requirements
REQ-BC-1. The service SHALL meter AI/API/compute usage — via the SDK `ReportCostUsage` (REQ-SDK-1) and/or call interception — and attribute it across **company, per-agent, per-module, and per-department** budgets, using a declared **cross-module attribution rule**.
REQ-BC-2. The service SHALL implement budget thresholds as **circuit breakers**: 80% → yellow alert (OS PM + Agent Owner); 95% → approval required for non-routine LLM calls; 100% → suspend non-deterministic agents; emergency override → Director approval.
REQ-BC-3. The service SHALL implement `IBudgetPort.CheckBudget(...)` so the Policy engine's cost gate (REQ-PE-15) returns real results. Over-budget SHALL yield the configured restriction (e.g. `REQUIRE_APPROVAL` for non-routine calls at 95%, suspension of non-deterministic agents at 100%) — and SHALL never silently allow a non-deterministic action over a hard budget stop.
REQ-BC-4. During a budget stop, **the entire control plane SHALL continue** (deterministic gates, context-freshness checks, authority checks, evidence checks, manual fallback). **The reasoning plane SHALL pause** (LLM reasoning, semantic review, weak-signal NLP, deep simulation, non-critical agent recommendations) unless individually approved. (This is the determinism-first law, REQ-SC-6, made operational.)
REQ-BC-5. The service SHALL support the required granularity (company, per-agent, per-module, per-department), an **emergency-override budget**, and a cost-attribution rule declared before deployment.
REQ-BC-6. All breaker events SHALL be append-only and traced.

### 9.3 Acceptance
Active only when real AI/API usage is metered, attributed, and at least one budget threshold has been tested (breaker fired in a controlled test).

---

## 10. Domain 10 — HITL Approval Queue

### 10.1 Purpose
Manage human approvals without becoming a rubber-stamp queue. Activates `IApprovalPort` that the SDK's `RequestApproval` routes to (Foundation had a stub record).

### 10.2 Functional requirements
REQ-HQ-1. The queue SHALL create an item from any Policy decision of outcome `REQUIRE_APPROVAL` (via the SDK), capturing: action, agent/principal, evidence links, resolved risk class, requested autonomy, and deadline.
REQ-HQ-2. The queue SHALL **route by risk class** to the `requiredApproverAuthority` returned in the decision, validated via Identity (the approver MUST be authorized for that class — REQ-ID-3). An approval attempt by an unauthorized approver SHALL be refused.
REQ-HQ-3. The queue SHALL enforce SLA per risk class with **timeout behavior**: C1 → expire/hold; C2–C3 → expire/hold and re-queue; **C4–C5 → fail-closed always** (never auto-execute on timeout).
REQ-HQ-4. The queue SHALL enforce **anti-rubber-stamp** controls: the approver SHALL confirm review of specific evidence fields (not a single click); approvals SHALL be sample-audited; the approve-without-override rate SHALL be tracked and exposed as a drift signal (feeds Domains 11 and 13).
REQ-HQ-5. The queue MAY batch low-risk items to prevent approval fatigue but SHALL NEVER batch C4/C5.
REQ-HQ-6. The queue SHALL support a **backup approver** for continuity and **escalation** for overdue or high-risk items.
REQ-HQ-7. On approval, the queue SHALL link the approval record to the originating decision (Decision domain link chain) and trace it; only then may the caller proceed with the action.
REQ-HQ-8. The queue SHALL expose `IApprovalPort`: `CreateApproval(decision)`, `Approve(approvalId, approver, confirmedEvidence)`, `Reject(...)`, `GetPending(authority)`.

### 10.3 Acceptance
Active only when real approvals pass through the queue and at least one overdue / backup / escalation case is logged.

---

## 11. Domain 11 — Capability-Claim Drift Detection

### 11.1 Purpose
Detect when documents, dashboards, presentations, or proposals claim more maturity than the evidence supports. (Wave 1; build after the MVP subset.)

### 11.2 Functional requirements
REQ-DD-1. The domain SHALL maintain the **claim → evidence** table: Active (test + audit + real execution), Automated (executes without manual re-entry), Autonomous (approved A-level + tested kill-switch), Predictive (validated baseline), Simulation twin (fidelity validation), Certified (certificate + scope), Real-time (measured latency), Integrated (proven interface contract).
REQ-DD-2. The authoritative drift check SHALL be a **deterministic register comparison**: a claim is compared against Registry control status, evidence links, kill-switch existence (Domain 8), eval results (Domain 14, when present), and twin fidelity records (Domain 16, when present).
REQ-DD-3. LLM-assisted prose scanning of documents MAY be used **only as a helper** to surface candidate claims; it SHALL NEVER be the authority. Any LLM-flagged claim SHALL be confirmed against the register (REQ-DD-2).
REQ-DD-4. The domain SHALL implement the **drift-response workflow**: claim too strong → downgrade wording; evidence missing → mark Designed; external claim affected → withdraw/correct; proposal/tender affected → legal/compliance review; customer already received the claim → management decision; repeated drift → owner escalation (Domain 8).
REQ-DD-5. The domain SHALL run a **scheduled monthly scan**, record findings, link each to the affected object and owner, and feed the Health dashboard (Domain 13).
REQ-DD-6. The domain SHALL expose `IDriftPort`: `ScanRegister()`, `ScanDocument(ref)`, `RecordFinding(...)`, `GetOpenFindings()`.

### 11.3 Acceptance
Active only when at least one real document or proposal is scanned against the control register and drift findings are reviewed.

---

## 12. Domain 12 — Weak-Signal Validation

### 12.1 Purpose
Prevent a weak-signal watch-list from becoming intelligence noise. (Wave 1; build after the MVP subset.)

### 12.2 Functional requirements
REQ-WS-1. The domain SHALL store a **weak-signal record**: signal_id, source, summary, affected area, potential impact, owner, proposed action, decision-triggered (yes/no/deferred), journal reference, 90-day outcome.
REQ-WS-2. The domain SHALL enforce the **workflow**: record → assign owner → assign potential impact → propose action or monitoring rule → 30-day decision check → if a decision is triggered, record it in the Decision Journal (Domain 5) → 90-day outcome review.
REQ-WS-3. The domain SHALL **deprioritize a source** that yields no decision, no action, and no useful monitoring change for three consecutive review cycles.
REQ-WS-4. The domain SHALL surface a weekly review list and enforce the 30-day and 90-day timers.
REQ-WS-5. The domain SHALL expose `IWeakSignalPort`: `RecordSignal(...)`, `Review(signalId, classification)`, `RecordOutcome(...)`.

### 12.3 Acceptance
Active only when weak signals have gone through at least one 30-day and one 90-day review cycle.

---

## 13. Domain 13 — OS Health Metrics & Dashboard

### 13.1 Purpose
Aggregate the **leading indicators** of whether GSPE OS is healthy — behavioral signals, not "documents complete." (MVP-critical.)

### 13.2 Functional requirements
REQ-HM-1. The domain SHALL compute leading indicators from the other domains: recommendation acceptance rate, override rate, escalation frequency, mean-time-to-kill, cost per decision, eval pass rate (when Domain 14 exists), interface SLA adherence, drift findings per month, weak-signal conversion, twin fidelity error (when Domain 16 exists), HITL queue latency, **approve-without-override rate**, and incident/near-miss count.
REQ-HM-2. Each metric SHALL have an **owner** and a **review cadence**; red/yellow thresholds SHALL trigger an assigned action (escalation to Domain 8 where appropriate). A metric with no owner and no triggered action SHALL NOT be added (avoid dashboard theater).
REQ-HM-3. The domain SHALL read from Tracing (4), Decision (5), HITL queue (10), Kill-switch (8), Budget (9), Drift (11), and Weak-signal (12) **via their ports only** (REQ-SC-3).
REQ-HM-4. The domain SHALL store append-only metric snapshots for trend analysis. The dashboard exists to drive decisions, not to display status.
REQ-HM-5. The domain SHALL expose `IHealthPort`: `ComputeMetrics(window)`, `GetMetric(id)`, `RaiseThresholdBreach(...)`.

### 13.3 Acceptance
Active only when real data from multiple domains feeds the dashboard and red/yellow indicators trigger an assigned action.

---

## 14. Updated path to the MVP and beyond

Foundation (Domains 1–7) + the MVP-critical Wave-1 subset (**8, 9, 10, 13**) constitute the **v3.6 11-domain MVP** — a usable, enforcing control plane even before production agents exist. Adding **11** and **12** completes Wave 1. Wave 2 (Eval harness 14, Memory governance 15) is required before production-grade agents; Wave 3 (Twin maturity 16) is deferred until telemetry and fidelity mature. The production-honesty rule (REQ-SC-16) governs every "Active" claim throughout.

*End of Wave 1 SRS extension.*
