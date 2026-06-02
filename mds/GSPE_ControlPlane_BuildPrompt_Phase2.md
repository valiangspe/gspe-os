# Claude Code Build Prompt — GSPE OS Control Plane Platform

## Phase 2: Complete the Foundation Wave

> Run this **after Phase 0–1** in the same repository. `GSPE_ControlPlane_SRS_Foundation.md`, `CLAUDE.md`, `ORCHESTRATOR.md`, and the frozen contract assembly already exist, and the walking skeleton passes. This prompt deepens; it does not rebuild.

---

## Role and mission

You are the senior .NET engineer continuing the **GSPE OS Control Plane Platform**. Phase 1 proved the architecture with one action through five minimal sockets. Your mission now is to bring the seven Foundation domains to **full requirement depth** per the SRS, so the control plane is genuinely operable — registries with lifecycle, real authority and auth, full tracing and decision records, a working Interface Contract Register, and a complete SDK with generated clients.

Do not start Wave 1 (Kill-switch, Budget, HITL queue, Drift, Weak-signal, Health). Those remain ports/stubs until their own phase.

---

## Source of truth and reading order

1. Re-read `CLAUDE.md` first (conventions + Decisions log) and `ORCHESTRATOR.md` (sequence).
2. The SRS is authoritative. For each task below, load the cited section.
   - Part 1 (System Core) — laws and cross-cutting requirements still bind.
   - §4.1 Identity, §4.2 Registry, §4.4 Tracing, §4.5 Decision, §4.6 Interface Register, §4.7 SDK — bring each to full FR depth.
   - §4.3 Policy & Gating Engine + Appendix A — already complete from Phase 1; **do not change the frozen contract**. Only harden if a test reveals a gap, and bump the contract version if you must touch it.
3. SRS wins over this prompt on conflict. Fill silence with the smallest reasonable decision and log it in `CLAUDE.md` → Decisions.

---

## Guardrails (unchanged — they still bind)

Modular monolith, vertical slices, **ports-only** cross-domain access (no foreign-table reads). Policy engine core stays **pure**. **Deterministic + fail-closed** for C2–C5. **No-trace → DENY.** **Idempotency** on every mutation. **No local auth** — authorization only, over Authentik/CTS. **Append-only** records. Governance matrix is **versioned data** in Registry. The **C4/C5 hard rule** (REQ-PE-9) stays a separately-tested rule. Do not introduce Redis/Kafka/Temporal this phase (REQ-SC-9) unless the SRS forces it.

---

## Preconditions to verify before starting

- The walking-skeleton tests (the §4.3.5 eval table + two end-to-end paths + determinism + fail-closed) are green.
- The six domain schemas exist; the frozen contract assembly is intact.
If any precondition fails, fix it before proceeding and note it in `CLAUDE.md`.

---

## Phase 2 tasks

### 2.1 Identity, RBAC & Authority — to full depth (SRS §4.1)
- Replace the stubbed identity verification with **real integration**: validate Authentik OIDC tokens against Authentik's JWKS for users; validate **CTS**-issued credentials for agents/services (M2M). Map verified claims → GSPE OS principal (roles + department). (REQ-ID-1, REQ-SC-14)
- Build the **authority matrix** as admin-managed data: `(role, action class, resource type) → permitted / approver-required / forbidden`, with CRUD and change history. (REQ-ID-2)
- Implement all **approval authorities** — FINANCE, SAFETY, CUSTOMER, ISO, AI_GOVERNANCE — plus DIRECTOR and named backup. (REQ-ID-3)
- Implement **segregation-of-duties** as enforced data rules (builder ≠ sole approver for C4/C5 and for reinstatement after a safety/security stop). (REQ-ID-4)
- Implement **emergency authority** (Director + backup paths). Log every authority check with `traceId`. (REQ-ID-6)

### 2.2 Registry — to full depth (SRS §4.2)
- Build all six registries with full CRUD: agents, tools, orchestrators, workflows, memory stores, interfaces. (REQ-RG-1)
- Complete the **tool contract**: input/output schema, side-effect class, idempotency flag, reversibility/rollback method, permission scope, data classification touched, rate limit, cost class, failure behavior (fail-closed default), version. (REQ-RG-3)
- Enforce the **control-status lifecycle** with legal transitions: Proposed → Designed → Tested → Active → Suspended → Retired (and the rules for each transition, e.g. Tested requires eval evidence — record the evidence link even though the Eval harness itself is Wave 2). (REQ-RG-4)
- Enforce **"no use before registration"**: the Policy boundary rejects any agent/tool/workflow not registered and in an appropriate status. (REQ-RG-5)
- Implement **governance-matrix versioning + change control**: matrix edits bump `matrixVersion`, require an approver, and are auditable. (REQ-RG-7)

### 2.3 Tracing & Observability — to full depth (SRS §4.4)
- Capture the **complete trace event schema** (all REQ-TR-2 fields) for every gated action, not just the skeleton subset.
- Build the **query API**: by traceId, principal, application, workflow, time window, and outcome. (REQ-TR-3)
- Apply **retention** by classification (REQ-SC-13). Expose OpenTelemetry emission hooks but keep the Postgres trace store as the system of record for this wave (REQ-SC-9).

### 2.4 Decision Records — to full depth (SRS §4.5)
- Complete the **Decision Journal**, **Explanation Log**, and **Outcome Review** with the full link chain `traceId → decisionId → explanationLogId → approvalId? → evidenceLinks → outcomeReviewId?`. (REQ-DR-1..4)
- Ensure value-copy context snapshots (`jsonb`), append-only.
- Implement **retention/deletion with lawful-basis handling**: when base data is deleted, the linked explanation is deleted, anonymized, or retained only with a recorded lawful basis. (REQ-DR-6)

### 2.5 Interface Contract Register — full build (SRS §4.6; Phase 1 scaffolded only)
- Implement interface registration with all fields (source, target, deliverable, format, owner, SLA/cadence, acceptance criteria, evidence, escalation rule, change-notice period). (REQ-IF-1)
- Implement **health tracking** (green/yellow/red against SLA) and handoff-evidence recording. (REQ-IF-2)
- Implement the **change-control workflow**: notice (default 14 days) → impact assessment → test/dry-run → owner approval → rollback plan. (REQ-IF-3)
- Seed the **seven-project interface matrix** from the doctrine as initial records; set owner = OS Program Manager.

### 2.6 Control Plane SDK — complete + multi-language (SRS §4.7)
- Complete the **.NET SDK** (first-class, hand-crafted, dogfooded): all eight functions — `EmitTrace`, `CheckPolicy`, `RequestApproval`, `RecordDecision`, `CheckContextFreshness`, `ReportCostUsage`, `RegisterEvidence`, `TriggerFallback` — each auto-propagating `traceId` and requiring `idempotencyKey` on mutations. (REQ-SDK-1, REQ-SDK-3, REQ-SDK-6)
- Generate clients for **TypeScript, Python/FastAPI, Java/Spring, and PHP/Laravel** from the single OpenAPI document (REQ-SDK-2), plus a documented **REST fallback** for legacy apps (REQ-SDK-4).
- Provide a short integration guide showing a real app calling `CheckPolicy` and honoring obligations. (Going **Active** requires two real apps integrated — that is a real-world step, tracked in `ORCHESTRATOR.md`, not completed in this session.)

### 2.7 Cross-cutting hardening
- Ensure structured problem-details errors correlate by `traceId` and never leak restricted data (REQ-SC-15).
- Confirm idempotency works end-to-end (retry a mutation, assert no duplicate effect).
- Confirm every Foundation write path is append-only / audit-grade (REQ-SC-12).

---

## Deferred to their own phases (do not build now)
- The **Vue 3 / PrimeVue admin console** — its own UI phase.
- **Real two-app integration** of the SDK — a real-world rollout step.
- **Wave 1** domains (Kill-switch, Budget, full HITL queue, Drift, Weak-signal, Health) and **Waves 2–3**.

---

## Phase 2 Definition of Done (acceptance — must all pass)

- Every Foundation FR cited above has implementation and tests; the test suite is green.
- A **full-Foundation demo scenario** runs end-to-end and is asserted by tests: register an agent and move it through the status lifecycle → register its tool with a complete contract → run **several action classes** (a C0 ALLOW, a C2 REQUIRE_APPROVAL, a C4 DENY) through Policy via the SDK → record decisions with explanations → record an interface handoff with health → query the traces back by `traceId`.
- Real **Authentik/CTS** token/credential validation is exercised by integration tests (against a test issuer/JWKS).
- Idempotency, fail-closed, and append-only invariants each have a dedicated passing test.
- Other-language SDK clients are generated and build; the REST fallback is documented.
- `CLAUDE.md` Decisions log updated. In `ORCHESTRATOR.md`, mark Foundation domains **Tested**; note the remaining real-execution steps required to mark each **Active** per REQ-SC-16 (e.g. SDK needs two real apps; Interface Register needs one real reviewed handoff).

---

## Working style
- Small, reviewable commits: one domain to full depth at a time, tests after each.
- Keep the Policy engine untouched unless a test proves a gap; if you must change the contract, bump its version and log it.
- End the session with: a Tested-vs-Active status table for all seven Foundation domains, the test run output, and the commands to run the full-Foundation demo locally.
