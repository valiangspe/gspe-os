# Software Requirements Specification

## GSPE OS Control Plane Platform — Foundation Wave (Wave 0)

**Status:** Baseline for build
**Source doctrine:** GSPE OS Architecture Doctrine v3.5 (hardened) + v3.6 (platform decomposition)
**Scope of this SRS:** the System Core plus the seven Foundation-wave backend domains, with the Policy & Gating Engine specified in depth. Waves 1–3 are referenced as ports and stubs only.

> This is the single source of truth for the build. It is structured as a stable **System Core** (Part 1, always loaded) and **per-domain sections** (Part 2). Later waves are added as new sections; the System Core does not get duplicated.

---

# PART 1 — SYSTEM CORE

## 1. Introduction

### 1.1 Purpose

The GSPE OS Control Plane Platform is the **deterministic governance, enforcement, observability, approval, and evidence layer** for GSPE OS. It does not replace existing business applications (CRM, Project, Engineering, PPC/PPIC, Procurement, Warehouse, Production, QC/QA, Finance, QMS, HR, DCIM). It sits beside and above them and makes them operate as one governed system.

### 1.2 The two planes (foundational law)

| Plane | Implemented as | May do | May NOT do |
|---|---|---|---|
| **Control plane** (this platform) | Deterministic code, rules, gates | Govern, gate, approve, trace, record, stop | — |
| **Reasoning plane** | LLMs / agents in existing apps or agent services | Propose, summarize, draft, detect, recommend | Commit a high-risk action on its own |

> Law: the reasoning plane may propose; the control plane governs; existing applications execute **only after** policy, approval, and validation are satisfied.

### 1.3 Definitions (glossary)

| Term | Meaning |
|---|---|
| Principal | The actor in a request — a `user` or an `agent`. |
| Action | A thing a principal wants to do to a resource. |
| Action class (C0–C5) | Side-effect risk: C0 read · C1 reversible write · C2 hard-to-undo write · C3 external comms · C4 financial · C5 safety. |
| Autonomy level (A0–A5) | What an agent may do: A0 observe · A1 recommend · A2 prepare · A3 execute-after-approval · A4 execute-then-notify · A5 autonomous-in-bounds. |
| Gate | A single deterministic check in the policy pipeline (the A.R.T.E.F.A.C.T. checks). |
| Decision | The policy engine's verdict: ALLOW · REQUIRE_APPROVAL · DENY · DEGRADE, plus obligations and an explanation. |
| Obligation | An action the caller MUST perform to honor a decision (e.g. obtain approval, record decision, operate degraded). |
| Trace | The end-to-end record of an action, keyed by `traceId`. |
| Control status | Lifecycle of a governed object: Proposed · Designed · Tested · Active · Suspended · Retired. |
| SoT | Source of truth for a piece of context. |

## 2. Architecture

### 2.1 Architecture pattern — modular monolith, vertical slices

REQ-SC-1. The platform SHALL be built as a **single deployable modular monolith**, not as independent microservices.
REQ-SC-2. Each of the 16 domains SHALL be an independent **vertical slice**: its own folder, its own database schema, and its own published in-process contract (a port/interface).
REQ-SC-3. A domain SHALL access another domain **only through that domain's published contract** — never by reading or writing another domain's tables directly.
REQ-SC-4. The platform SHALL be structured so that any domain can later be extracted into a separate service by promoting its in-process contract to a network contract, with no change to its callers.
REQ-SC-5. The 14+ existing GSPE applications SHALL remain separate systems and SHALL interact with the platform **only through the Control Plane SDK / API** (Domain 7). They are service-oriented and stay that way.

### 2.2 Determinism and fail-safety

REQ-SC-6. All gating, approval routing, kill, budget, and decision logic SHALL be deterministic and SHALL NOT depend on a model behaving correctly.
REQ-SC-7. For action classes C2–C5, every gate SHALL **fail closed**: on dependency failure or ambiguity, the outcome SHALL NOT be ALLOW.
REQ-SC-8. Critical-path actions SHALL have a defined degraded-mode fallback; the platform SHALL return DEGRADE with a fallback obligation rather than blocking the business when a non-critical dependency is down.

### 2.3 Technology decisions

> **Change here if you prefer the Next.js / Drizzle stack.** The functional requirements below are stack-neutral; only this section is stack-specific.

| Layer | Decision (recommended) |
|---|---|
| Backend | .NET 8, Vertical Slice Architecture (one slice per domain; MediatR-style request handlers; minimal APIs) |
| ORM / data | EF Core + PostgreSQL; `jsonb` columns for snapshots, schemas, and explanations |
| API | One OpenAPI 3 document; Swagger UI; clients generated from it (no hand-written drift) |
| Frontend | Vue 3 + PrimeVue 4 (Aura) + Tailwind — one unified console, not 16 UIs |
| Auth | Authentik (OIDC) for users; CTS for machine-to-machine — the platform implements **no** local auth |
| Orchestration | n8n first; Temporal/Camunda only if complexity demands and can be operated |
| Telemetry | OpenTelemetry → Prometheus + Grafana (defer until needed; trace store is in Postgres for Foundation) |
| Cache/queue | Redis (introduce when needed, not in the walking skeleton) |
| Secrets | Infisical or environment-injected secrets |
| Tests | xUnit + FluentAssertions; the policy engine has the highest coverage requirement |

REQ-SC-9. The platform SHALL run within the constraints of a modest host (reference: 1 vCPU / 2 GB) for the Foundation wave; heavy components (Kafka, Temporal, Kubernetes, OpenSearch) SHALL NOT be introduced until event volume, reliability, or operability genuinely require them.

### 2.4 Cross-cutting requirements

REQ-SC-10. Every action that crosses the control plane SHALL carry a `traceId`. A request without one is invalid for any gated action.
REQ-SC-11. Every mutating SDK/API call SHALL accept an `idempotencyKey`; repeated keys SHALL NOT produce duplicate effects.
REQ-SC-12. All control-plane records (decisions, approvals, traces, kill events) SHALL be **append-only / audit-grade**; corrections are new records, never overwrites.
REQ-SC-13. Retention of records containing personal or restricted data SHALL follow **UU PDP No. 27/2022** plus applicable ISO, legal, and contractual rules; retention class SHALL be stored with the record.
REQ-SC-14. Authentication SHALL be delegated to Authentik/CTS; the platform SHALL only perform **authorization** (who may do what) on top of verified identity.
REQ-SC-15. Errors SHALL be structured (problem-details), correlated by `traceId`, and SHALL never leak restricted data in messages.

### 2.5 The production-honesty rule (applies to every domain)

REQ-SC-16. A control SHALL be marked **Active** only with all three of: a passing test, an audit-log entry, and at least one real (or controlled-test) execution. Code that has never run a real or test case is **Designed**, not Active — regardless of completeness.

## 3. Domain map and build sequence

The 16 domains across four waves (F.E.A.T.). This SRS specifies the **Foundation** seven.

| Wave | # | Domain | This SRS |
|---|---|---|---|
| Foundation | 1 | Identity, RBAC & Authority | specified |
| Foundation | 2 | Registry | specified |
| Foundation | 3 | **Policy & Gating Engine** | specified in depth |
| Foundation | 4 | Tracing & Observability | specified |
| Foundation | 5 | Decision Records | specified |
| Foundation | 6 | Interface Contract Register | specified |
| Foundation | 7 | Control Plane SDK | specified |
| Enforcement | 8–13 | Kill-switch, Budget, HITL queue, Drift, Weak-signal, Health | port + stub only |
| Agents | 14–15 | Eval harness, Memory governance | port + stub only |
| Twins | 16 | Twin maturity | port + stub only |

REQ-SC-17. The build sequence SHALL be: **freeze the Policy contract → walking skeleton (Identity, Registry, Policy, Tracing, Decision) → SDK → Interface Register → then Wave 1**. The Policy & Gating Engine is the chokepoint; its contract SHALL be frozen before any spoke is built.

---

# PART 2 — FOUNDATION DOMAIN REQUIREMENTS

## 4.1 Domain 1 — Identity, RBAC & Authority

### 4.1.1 Purpose
A thin authorization and authority layer over Authentik/CTS. It answers "who is this principal, and what action classes may they approve or perform on which resources?"

### 4.1.2 Functional requirements
REQ-ID-1. The domain SHALL resolve a verified identity (Authentik OIDC claims for users; CTS-issued credentials for agents/services) into a GSPE OS **principal** with roles and department.
REQ-ID-2. The domain SHALL maintain an **authority matrix** mapping `(role, action class C0–C5, resource type)` → permitted / approver-required / forbidden.
REQ-ID-3. The domain SHALL define **approval authorities** for FINANCE, SAFETY, CUSTOMER, ISO, and AI_GOVERNANCE decisions, plus DIRECTOR and a named backup.
REQ-ID-4. The domain SHALL enforce **segregation of duties**: the principal who built/owns an agent SHALL NOT be the sole approver for that agent's high-risk (C4/C5) actions or for reinstatement after a safety/security stop.
REQ-ID-5. The domain SHALL expose an in-process contract `IIdentityPort` with at least: `ResolvePrincipal(token)`, `HasAuthority(principal, actionClass, resourceType)`, `ApproverAuthorityFor(actionClass)`.
REQ-ID-6. All authority checks SHALL be logged with `traceId`.

### 4.1.3 Key data
`principal`, `role`, `department`, `authority_matrix`, `approval_authority`, `segregation_rule`, `emergency_authority`.

### 4.1.4 Acceptance (Definition of Done)
Active only when real users/agents are mapped, authority checks are logged, and at least one real approval routing uses the authority matrix.

## 4.2 Domain 2 — Registry

### 4.2.1 Purpose
The authoritative registry of agents, tools, orchestrators, workflows, memory stores, and interfaces, with their classifications and lifecycle status. The Policy engine reads from it.

### 4.2.2 Functional requirements
REQ-RG-1. The domain SHALL maintain registries for: agents, tools, orchestrators, workflows, memory stores, and interface contracts.
REQ-RG-2. Each **agent** record SHALL carry: purpose, owner, autonomy level (A0–A5), allowed-tool list, status, version.
REQ-RG-3. Each **tool** record SHALL carry a tool contract: input schema, output schema, side-effect class (C0–C5), idempotency flag, reversibility/rollback method, permission scope, data classification touched, rate limit, cost class, failure behavior (default fail-closed), version.
REQ-RG-4. The registry SHALL enforce classifications: autonomy A0–A5, action class C0–C5, control status (Proposed/Designed/Tested/Active/Suspended/Retired), data classification (Public/Internal/Confidential/Restricted).
REQ-RG-5. The domain SHALL reject use of any agent, tool, or workflow that is not registered or not in `Active`/`Tested` status appropriate to the environment ("no use before registration").
REQ-RG-6. The domain SHALL expose `IRegistryPort` with at least: `GetAgent(id)`, `GetTool(id)`, `IsToolAllowedForAgent(agentId, toolId)`, `GetGovernanceMatrix()`.
REQ-RG-7. The **governance matrix** (action class → max permitted autonomy + approval requirement) SHALL be stored as **versioned data** here, not hardcoded in the engine, and SHALL be change-controlled.

### 4.2.3 Acceptance
Active only when agents/tools/workflows are registered before use and at least one real Policy check reads from the registry.

## 4.3 Domain 3 — Policy & Gating Engine  *(centerpiece)*

### 4.3.1 Purpose
The deterministic core of the control plane. Given a request, it evaluates the eight A.R.T.E.F.A.C.T. checks and returns a **decision** (ALLOW / REQUIRE_APPROVAL / DENY / DEGRADE) with obligations and an explanation. It is the highest-leverage domain: every other domain references it.

### 4.3.2 The A.R.T.E.F.A.C.T. checks
| Letter | Check | Source |
|---|---|---|
| A | Authority — is the principal allowed? | Identity (Domain 1) |
| R | Risk class — resolve/validate C0–C5 | engine + request |
| T | Tool permission — tool in allow-list, class consistent | Registry (Domain 2) |
| E | Evidence — required support attached? | request + policy |
| F | Freshness — context within TTL / from SoT? | request + Registry/Memory |
| A | Autonomy — agent A-level ≤ ceiling for the class? | Registry governance matrix |
| C | Cost — budget remaining? | Budget port (Wave 1; pass-through stub in Foundation) |
| T | Trace — `traceId` present? | request |

### 4.3.3 Functional requirements
REQ-PE-1. The engine SHALL expose a synchronous decision operation: `Decide(PolicyDecisionRequest) → PolicyDecision`.
REQ-PE-2. The engine core SHALL be **pure and side-effect-free**: it SHALL NOT execute the requested action, mutate business state, send communications, or perform I/O. (Persisting the decision and emitting its trace are done by the control-plane boundary that wraps the engine, not by the core.)
REQ-PE-3. The engine SHALL be **deterministic**: identical input SHALL produce identical output for a given policy ruleset and governance-matrix version.
REQ-PE-4. The engine SHALL require a non-empty `traceId`; absence SHALL yield `DENY` with reason `no-trace`.
REQ-PE-5. The engine SHALL resolve the action's risk class. If the caller declares a class, the engine SHALL validate it against the action/resource type and SHALL **escalate to the higher** class on mismatch (never trust a lower declared class).
REQ-PE-6. The engine SHALL evaluate the eight checks in the order A→R→T→E→F→A→C→T and SHALL short-circuit on the first hard `DENY`, while still returning the full check list with statuses evaluated so far.
REQ-PE-7. The engine SHALL `DENY` when the agent's autonomy level exceeds the maximum permitted for the resolved action class per the governance matrix.
REQ-PE-8. The engine SHALL `DENY` when the requested tool is not in the agent's allow-list, or when the tool's side-effect class exceeds the resolved action class.
REQ-PE-9. **Hard rule:** for resolved class C4 (financial) or C5 (safety), the engine SHALL NEVER return `ALLOW` for an agent at autonomy ≥ A3 (no autonomous execution of financial or safety actions). The maximum non-escalated outcome for C4/C5 above the allowed autonomy ceiling is `REQUIRE_APPROVAL` (within ceiling) or `DENY` (above ceiling).
REQ-PE-10. The engine SHALL return `REQUIRE_APPROVAL` with `requiredApproverAuthority` when the resolved class mandates human approval per the matrix; the authority value SHALL come from Identity (REQ-ID-3).
REQ-PE-11. The engine SHALL enforce the **evidence gate**: for classes configured to require evidence, missing evidence SHALL yield `DENY` or `REQUIRE_APPROVAL` per policy.
REQ-PE-12. The engine SHALL enforce the **freshness gate**: context items past their declared TTL or not from an approved SoT SHALL yield `DENY` or `REQUIRE_APPROVAL` per the freshness policy.
REQ-PE-13. The engine SHALL enforce the **injection gate**: when `untrustedContentPresent = true`, the request SHALL NOT be permitted to escalate tool permission or autonomy, and any C2–C5 tool action SHALL require approval regardless of other checks.
REQ-PE-14. The engine SHALL enforce the **data-classification gate**: access to `Restricted` data by a role not authorized for it SHALL yield `DENY`.
REQ-PE-15. The engine SHALL consult the **cost gate** via the Budget port; in the Foundation wave this port returns "budget available" by default, but the engine SHALL already pass the cost result through to the decision so the real breaker plugs in unchanged in Wave 1.
REQ-PE-16. On unavailability of a non-critical dependency, the engine SHALL return `DEGRADE` with an `OPERATE_DEGRADED` obligation; it SHALL NEVER default to `ALLOW` on dependency failure for C2–C5 (fail-closed, per REQ-SC-7).
REQ-PE-17. Every decision SHALL include `obligations` — the explicit list of what the caller must do (e.g. `RECORD_DECISION`, `OBTAIN_APPROVAL`, `ATTACH_EVIDENCE`, `OPERATE_DEGRADED`).
REQ-PE-18. Every decision SHALL include an ordered `checks` explanation: each check's id, status (`pass`/`fail`/`na`), the deciding rule reference, and a short detail.
REQ-PE-19. Every decision SHALL record `policyRulesetVersion` and `matrixVersion`, enabling later drift detection and audit.
REQ-PE-20. The decision SHALL be persisted and traced by the control-plane boundary for every call (linked by `traceId` and `decisionId`).
REQ-PE-21. The engine SHALL meet a latency target of **p95 < 50 ms** for warm registry/identity reads (configurable NFR).

### 4.3.4 Frozen contract (freeze this before building any spoke)
The canonical request/response. See Appendix A for full JSON.

`PolicyDecisionRequest`: traceId, idempotencyKey, principal{type,id,agentVersion?,autonomyLevel?}, sourceApplication, workflow?, action{type,declaredClass?,resource{type,id}}, tool?{id,sideEffectClass?}, context[]{key,sourceId,asOf,ttlSeconds}, evidence[]{type,ref}, dataClassification?, untrustedContentPresent, policyVersionPin?

`PolicyDecision`: decisionId, traceId, outcome, resolvedActionClass, requiredApproverAuthority?, obligations[], checks[]{id,status,rule,detail}, policyRulesetVersion, matrixVersion, evaluatedAtUtc, latencyMs

### 4.3.5 Evaluation cases (these become the eval suite)
| Case | Input gist | Expected outcome |
|---|---|---|
| Read by authorized user | C0, user with role | ALLOW |
| Reversible write, agent A2 | C1, A2, tool allowed | ALLOW (+ audit obligation) |
| Finalize document, agent A2 | C2, A2 | REQUIRE_APPROVAL |
| Email customer, agent A3, no approver | C3, A3 | REQUIRE_APPROVAL (CUSTOMER authority) |
| Approve payment, agent A3 | C4, A3 | DENY (REQ-PE-9) |
| Approve safety work, agent A4 | C5, A4 | DENY (REQ-PE-9) |
| Any action, no traceId | — | DENY (no-trace) |
| Tool not in allow-list | C1, agent, foreign tool | DENY |
| Stale BOM context | C2, ttl exceeded | REQUIRE_APPROVAL or DENY |
| Untrusted content + C3 tool | injection flag true | REQUIRE_APPROVAL (no escalation) |
| Restricted data, unauthorized role | C0 on restricted | DENY |
| Dependency down, C2 | registry timeout | DEGRADE, never ALLOW |

### 4.3.6 Acceptance
Active only when at least one real system action is blocked, approved, or routed by the engine and the result is logged.

## 4.4 Domain 4 — Tracing & Observability

### 4.4.1 Purpose
The data backbone for all control-plane evidence — the raw material for decision records, incident analysis, cost attribution, approval audit, and (later) drift detection.

### 4.4.2 Functional requirements
REQ-TR-1. The domain SHALL generate or accept a `traceId` and propagate it across the action's lifecycle.
REQ-TR-2. Each trace event SHALL capture: traceId, principal, source application, workflow, resolved action class, autonomy level, input snapshot, freshness result, policy gate result, tool calls, approval status, cost/token usage, final outcome, and any error.
REQ-TR-3. Traces SHALL be append-only and queryable by traceId, principal, application, workflow, time window, and outcome.
REQ-TR-4. The domain SHALL expose `ITracePort` with at least: `StartTrace(...)`, `RecordEvent(traceId, event)`, `GetTrace(traceId)`.
REQ-TR-5. Trace retention SHALL follow REQ-SC-13; restricted-data fields SHALL be stored per their classification.

### 4.4.3 Acceptance
Active only when real cross-application actions produce trace IDs linkable to decisions and approvals.

## 4.5 Domain 5 — Decision Records

### 4.5.1 Purpose
The Decision Journal and the AI Decision Explanation Log as one linked record system, sharing the trace ID.

### 4.5.2 Functional requirements
REQ-DR-1. The domain SHALL record, for a governed decision: what was decided, by whom, using which context (value-copy snapshot, not a live reference).
REQ-DR-2. The domain SHALL record an **Explanation Log** entry capturing how an AI/agent recommendation was formed and governed (agent + version, prompt/config version, tool calls, gate results, uncertainty flags, evidence links, alternatives considered).
REQ-DR-3. Records SHALL be linked in the chain `traceId → decisionId → explanationLogId → approvalId? → evidenceLinks → outcomeReviewId?`.
REQ-DR-4. The domain SHALL support a later **outcome review** entry recording the actual result and lesson.
REQ-DR-5. The domain SHALL expose `IDecisionPort` with at least: `RecordDecision(...)`, `RecordExplanation(...)`, `LinkApproval(...)`, `RecordOutcome(...)`.
REQ-DR-6. Retention and deletion SHALL follow REQ-SC-13; when base data is deleted, the linked explanation SHALL be deleted, anonymized, or retained only with a lawful basis.

### 4.5.3 Acceptance
Active only when a real critical decision is recorded with value-copy context, approver, evidence, and a later outcome review.

## 4.6 Domain 6 — Interface Contract Register

### 4.6.1 Purpose
The authoritative record of interface contracts between the seven GSPE OS projects and between operational applications. Owner: OS Program Manager. Reviewed monthly.

### 4.6.2 Functional requirements
REQ-IF-1. The domain SHALL register interface contracts with: source, target, deliverable, format, owner, SLA/cadence, acceptance criteria, evidence, escalation rule, change-notice period.
REQ-IF-2. The domain SHALL track interface **health** (green/yellow/red) against SLA and record handoff evidence.
REQ-IF-3. The domain SHALL enforce **change control**: no interface field/format/trigger change without notice (default 14 days), impact assessment, test/dry-run, owner approval, and rollback plan.
REQ-IF-4. The domain SHALL expose `IInterfacePort` with at least: `RegisterInterface(...)`, `RecordHandoff(...)`, `GetHealth(...)`.

### 4.6.3 Acceptance
Active only when at least one project-to-project or app-to-app interface is reviewed against SLA and recorded with health status.

## 4.7 Domain 7 — Control Plane SDK

### 4.7.1 Purpose
Standard client libraries and API wrappers existing applications use to talk to the control plane, so no application re-implements control logic.

### 4.7.2 Functional requirements
REQ-SDK-1. The SDK SHALL provide: `EmitTrace()`, `CheckPolicy()`, `RequestApproval()`, `RecordDecision()`, `CheckContextFreshness()`, `ReportCostUsage()`, `RegisterEvidence()`, `TriggerFallback()`.
REQ-SDK-2. The SDK and the platform API SHALL be generated from **one OpenAPI document** so client and server cannot drift.
REQ-SDK-3. All mutating SDK calls SHALL require an `idempotencyKey` and SHALL surface the server's idempotent result on retry.
REQ-SDK-4. The SDK SHALL ship for **.NET first** (dogfooded by existing .NET apps), then Java/Spring, PHP/Laravel, Python/FastAPI, and TypeScript; a **REST fallback** SHALL serve legacy apps.
REQ-SDK-5. The SDK SHALL never make a gated action proceed locally; it SHALL obtain a decision from the engine and honor the returned obligations.
REQ-SDK-6. The SDK SHALL attach/propagate `traceId` automatically across calls within an action.

### 4.7.3 Acceptance
Active only when at least two existing GSPE applications use the SDK/API wrapper in real workflows.

---

# PART 3 — THE WALKING SKELETON (first milestone)

## 5. Walking skeleton

### 5.1 Goal
Prove the architecture end-to-end with **one real action** before building breadth. The skeleton exercises five sockets: Identity → Registry → Policy → Tracing → Decision, consumed via the SDK.

### 5.2 The action
**"PPC requests to release a Work Order."** Resolved class: C2 (hard-to-undo internal write). The request declares the WO resource, the principal, and the context items used (e.g. BOM `asOf`, stock readiness) with TTLs.

### 5.3 The flow
1. The PPC app (or a test caller) calls `Sdk.CheckPolicy(request)` with a fresh `traceId` and `idempotencyKey`.
2. The control-plane boundary starts a trace, calls the Policy engine.
3. The engine runs A.R.T.E.F.A.C.T.: Authority (Identity), Risk (resolve C2), Tool (Registry), Evidence, Freshness (BOM TTL), Autonomy (if agent), Cost (stub), Trace.
4. The engine returns a decision + obligations + explanation. The boundary persists the decision (Decision Records) and records the trace event.
5. If `REQUIRE_APPROVAL`, the SDK calls `RequestApproval(...)` (Foundation: a minimal approval record; the full queue is Wave 1) and links it to the decision.
6. The business action proceeds **only** if the decision is `ALLOW` (or after approval is granted).

### 5.4 Skeleton acceptance (Phase 1 Definition of Done)
The skeleton "walks" when a single WO-release request produces, all linked by one `traceId`:
- a trace record (Domain 4),
- a policy decision with full explanation and obligations (Domain 3),
- a decision-journal entry with value-copy context (Domain 5),
- and, on the approval path, an approval record (stub) linked to the decision.

Two automated paths SHALL pass: one `ALLOW` and one `REQUIRE_APPROVAL`/`DENY`, demonstrating the gate actually gates.

---

# PART 4 — SCOPE BOUNDARIES

## 6. Out of scope for this SRS (Foundation)
The following are referenced as **ports/stubs** so they plug in unchanged later, but are NOT built here: Kill-switch & Escalation (8), Budget & Circuit Breaker (9), full HITL Approval Queue (10), Drift Detection (11), Weak-Signal Validation (12), OS Health Dashboard (13), Evaluation Harness (14), Memory & Context Governance (15), Digital Twin Maturity (16). Autonomous agents, predictive twins, simulation twins, and advanced multi-agent orchestration are excluded.

## 7. Path to the v3.6 MVP
This SRS targets Foundation (Wave 0) with Policy as the centerpiece and a walking skeleton as the first milestone. Continuing past the skeleton to complete Foundation, then adding the Wave-1 enforcement domains (Kill-switch, Budget, HITL queue, Health dashboard), reaches the v3.6 11-domain MVP — a usable control plane even before production agents exist.

---

# APPENDIX A — Canonical Policy contract (freeze first)

```jsonc
// PolicyDecisionRequest
{
  "traceId": "uuid",                       // REQUIRED; absent => DENY (no-trace)
  "idempotencyKey": "uuid",                // for the calling action
  "principal": {
    "type": "user | agent",
    "id": "string",
    "agentVersion": "string?",             // agents only
    "autonomyLevel": "A0|A1|A2|A3|A4|A5?"  // agents only
  },
  "sourceApplication": "string",           // e.g. "PPC"
  "workflow": "string?",                   // e.g. "work-order-release"
  "action": {
    "type": "string",                      // e.g. "release_work_order"
    "declaredClass": "C0|C1|C2|C3|C4|C5?", // optional; engine validates/escalates
    "resource": { "type": "string", "id": "string" }
  },
  "tool": { "id": "string?", "sideEffectClass": "C0|C1|C2|C3|C4|C5?" },
  "context": [
    { "key": "bom", "sourceId": "string", "asOf": "iso-8601", "ttlSeconds": 3600 }
  ],
  "evidence": [ { "type": "string", "ref": "string" } ],
  "dataClassification": "Public|Internal|Confidential|Restricted?",
  "untrustedContentPresent": false,
  "policyVersionPin": "string?"
}

// PolicyDecision
{
  "decisionId": "uuid",
  "traceId": "uuid",
  "outcome": "ALLOW | REQUIRE_APPROVAL | DENY | DEGRADE",
  "resolvedActionClass": "C0|C1|C2|C3|C4|C5",
  "requiredApproverAuthority": "FINANCE|SAFETY|CUSTOMER|ISO|AI_GOVERNANCE|DIRECTOR|null",
  "obligations": ["RECORD_DECISION","OBTAIN_APPROVAL","ATTACH_EVIDENCE","OPERATE_DEGRADED"],
  "checks": [
    { "id": "authority", "status": "pass|fail|na", "rule": "string", "detail": "string" },
    { "id": "risk",      "status": "pass|fail|na", "rule": "string", "detail": "string" },
    { "id": "tool",      "status": "pass|fail|na", "rule": "string", "detail": "string" },
    { "id": "evidence",  "status": "pass|fail|na", "rule": "string", "detail": "string" },
    { "id": "freshness", "status": "pass|fail|na", "rule": "string", "detail": "string" },
    { "id": "autonomy",  "status": "pass|fail|na", "rule": "string", "detail": "string" },
    { "id": "cost",      "status": "pass|fail|na", "rule": "string", "detail": "string" },
    { "id": "trace",     "status": "pass|fail|na", "rule": "string", "detail": "string" }
  ],
  "policyRulesetVersion": "string",
  "matrixVersion": "string",
  "evaluatedAtUtc": "iso-8601",
  "latencyMs": 0
}
```

# APPENDIX B — Governance matrix (versioned data, owned by Registry)

| Action class | Max autonomy without approval | Default human gate |
|---|---|---|
| C0 read | A5 | none |
| C1 reversible write | A4 | audit |
| C2 hard-to-undo write | A3 | approval |
| C3 external communication | A3 | approval before send |
| C4 financial | A2 | finance-authorized approval; never ALLOW ≥ A3 |
| C5 safety | A1/A2 | safety-authorized approval; never autonomous |

*End of Foundation-wave SRS.*
