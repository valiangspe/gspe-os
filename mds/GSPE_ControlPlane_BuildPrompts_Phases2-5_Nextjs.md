# Claude Code Build Prompts — GSPE OS Control Plane Platform (Next.js / Drizzle)

## Phases 2–5

> Use these **instead of** the .NET `Phase2`/`Phase3`/`Phase4`/`Phase5` prompts if you adopt the Next.js / Drizzle stack. **How to use:** paste the **Shared preamble** below plus the **one phase section** you're building into Claude Code. Each phase mirrors its .NET counterpart in goals, tasks, wiring, and acceptance — only the idiom differs. The full per-scenario acceptance lives in `GSPE_ControlPlane_TestDemoScript.md` (referenced by scenario ID).

---

# Shared preamble (applies to all four phases)

## Role and source of truth
You are a senior TypeScript engineer continuing the **GSPE OS Control Plane Platform** on **Next.js (App Router) + Drizzle + PostgreSQL**. The SRS is authoritative: `GSPE_ControlPlane_SRS_Foundation.md` (+ Wave 1/2/3 extensions) and `GSPE_ControlPlane_SRS_TechVariant_NextjsDrizzle.md` (replaces §2.3). Re-read `CLAUDE.md` and `ORCHESTRATOR.md` first. SRS wins on conflict; fill silence with the smallest reasonable decision and log it in `CLAUDE.md` → Decisions.

## Guardrails (TS idiom — unchanged in intent)
- **Modular monolith, vertical slices:** `src/domains/<domain>/` (`schema.ts` under its own Postgres schema, `port.ts`, service, handlers, tests); shared `packages/contracts` (Zod), `packages/db` (Drizzle), `packages/sdk`.
- **Ports-only:** a domain imports another's `port.ts` only — enforced by the **ESLint boundary rule** (cross-table import fails lint).
- **Policy engine core is pure** (`domains/policy/engine.ts`, no I/O); the boundary does fetch/persist/trace. **Frozen contract** (`packages/contracts` Zod) — never change without a version bump + logged note.
- **Deterministic + fail-closed** for C2–C5; **no-trace → DENY**; **idempotency** on every mutation; **append-only** audit records (insert-only Drizzle); **C4/C5 hard rule** separately tested; **governance matrix is versioned data**.
- **Injectable clock** (`IClock`) for SLAs, sampling cadence, and 30/90-day/monthly cycles. **Auth** via Authentik/CTS through `jose` — no local auth. **Tests: Vitest.** No Redis/Kafka/Temporal unless the SRS forces it.

## Working style (all phases)
Small, reviewable commits — one domain/area at a time, run build + Vitest + the boundary lint after each; keep the Policy engine and frozen contract untouched; end each session with a Tested-vs-Active status table, the Vitest output, and the commands to run that phase's demo (`GSPE_ControlPlane_TestDemoScript.md`).

---

# Phase 2 — Complete the Foundation Wave

**Precondition:** the Phase 0–1 walking skeleton passes (eval table, two e2e paths, determinism, fail-closed, boundary lint). Bring the seven Foundation domains to full requirement depth.

## Tasks
- **2.1 Identity (§4.1):** replace the stubbed verification with real **Authentik OIDC via `jose`/JWKS** (users) and **CTS** (M2M); build the **authority matrix** (CRUD + history); approval authorities (FINANCE/SAFETY/CUSTOMER/ISO/AI_GOVERNANCE + DIRECTOR + backup); **segregation of duties**; emergency authority; log every check with `traceId`. (REQ-ID-1..6)
- **2.2 Registry (§4.2):** all six registries with CRUD; the **complete tool contract** (schemas, side-effect class, idempotency, reversibility, permissions, data class, rate limit, cost class, failure behavior, version); the **status lifecycle** with legal transitions; **no-use-before-registration**; **governance-matrix versioning + change control** (`matrixVersion` bump + approver). (REQ-RG-1..7)
- **2.3 Tracing (§4.4):** the complete trace event schema (all REQ-TR-2 fields); the **query API** (traceId/principal/app/workflow/time/outcome); retention by classification; OpenTelemetry hooks with the Postgres trace store as system of record. (REQ-TR-1..5)
- **2.4 Decision Records (§4.5):** complete Journal + Explanation Log + Outcome Review with the full link chain; value-copy `jsonb` snapshots; retention/deletion with lawful-basis handling. (REQ-DR-1..6)
- **2.5 Interface Contract Register (§4.6):** full build — register (all fields), health (green/yellow/red vs SLA), change control (notice/impact/test/approval/rollback), seed the seven-project matrix, owner = OS Program Manager. (REQ-IF-1..4)
- **2.6 SDK (§4.7):** complete the **TS SDK** (all eight functions, auto-`traceId`, `idempotencyKey` on mutations); generate **C#/Java/PHP/Python** clients from the OpenAPI doc; documented REST fallback; an integration guide. (REQ-SDK-1..6)
- **2.7 Hardening:** structured problem-details errors correlated by `traceId` (no restricted-data leakage); idempotency proven end-to-end; append-only verified on audit paths. (REQ-SC-12/15)

## Definition of Done
The Foundation suites are green and **scenarios P2-S1…P2-S10** pass (incl. the full-Foundation demo, real Authentik/CTS validation, idempotency, fail-closed, append-only, and other-language SDK clients building). Mark Foundation domains **Tested**; note the real-execution steps to reach **Active** (SDK needs two real apps; Interface Register needs one real reviewed handoff).

---

# Phase 3 — Wave 1 Enforcement (→ MVP)

**Precondition:** Phase 2 green. Read Wave 1 §8–§13. Promote the `BudgetPort` and `ApprovalPort` **stubs to real** without changing the frozen contract. Build order: **8 → 9 → 10 → 13** (the MVP subset), then **11 → 12**.

## Tasks
- **8 Kill-Switch (§8):** three-level **state machine** (Soft→A0 / Functional / Hard); authority via Identity; `raiseEscalation` routed per the protocol; **wire the integration that makes a stop real** — applying a stop sets the Registry status to `Suspended`, and the Policy engine (which reads agent status from Registry) then DENYs out-of-scope actions; reinstatement workflow (root cause, regression-evidence link until Phase 4, second reviewer for safety/security); runaway/loop signals → Functional Stop; multi-agent suspension; `KillSwitchPort`. (REQ-KS-1..9)
- **9 Budget (§9):** meter via SDK `reportCostUsage`; attribute (company/agent/module/department + rule); breakers 80/95/100/emergency; **promote `BudgetPort.checkBudget`** so the Policy cost gate returns real results (no contract change); the **continue/pause split** during a stop; append-only. (REQ-BC-1..6)
- **10 HITL Queue (§10):** **promote `ApprovalPort`** to a real queue fed by `REQUIRE_APPROVAL` decisions via the SDK; **route by risk class** to the required authority (Identity-validated; refuse unauthorized); SLA + timeout (C4/C5 **fail-closed**, via `IClock`); **anti-rubber-stamp** (confirm specific evidence; track approve-without-override); batch low-risk, never C4/C5; backup + escalation; link approval into the decision chain. (REQ-HQ-1..8)
- **13 Health (§13):** compute the leading indicators (eval-pass-rate/twin-fidelity left null); each metric has an **owner + cadence**; red/yellow raises an assigned action; read from all ports **ports-only**; append-only snapshots; metrics API only (UI is the console). (REQ-HM-1..5)
- **11 Drift (§11) — after MVP:** claim→evidence table; **deterministic register comparison** as the authority; LLM document scan as helper only; response workflow; **monthly scan** via `IClock`; feed Health; `DriftPort`. (REQ-DD-1..6)
- **12 Weak-Signal (§12) — after MVP:** record + workflow with **30/90-day timers** (`IClock`); deprioritize barren sources; weekly list; `WeakSignalPort`. (REQ-WS-1..5)

## Integration wiring (do explicitly)
kill-switch → Registry status → Policy `DENY`; budget breaker → `BudgetPort` → Policy cost gate; HITL ← SDK `requestApproval` → decision chain; Health ← all ports.

## Definition of Done
**Scenarios P3-S1…P3-S9** all fire for real (stopped agent denied; reinstatement second reviewer; breaker changes a decision; C4 routes to FINANCE; C5 timeout fails closed; anti-rubber-stamp; live Health breach; deterministic drift; weak-signal cycle). Record the **MVP-reached** milestone after 8/9/10/13. Mark Wave-1 domains **Tested**; note Active steps.

---

# Phase 4 — Wave 2 (Agent Readiness)

**Precondition:** Phase 3 green. Read Wave 2 §14–§15. This replaces three stubs: the manual regression-evidence link in reinstatement, the Foundation freshness stub, and the null Health eval-pass-rate.

## Tasks
- **14 Eval Harness (§14):** golden datasets per agent; eval **suites** (correctness, safety/red-team **incl. injection**, schema, tool-use, cost/latency, regression) returning pass/fail vs threshold + score; the **AI impact assessment** as gate evidence; **promotion gates** (`Designed → Tested`: impact + eval pass + tested kill-switch; `Tested → Active`: owner + second reviewer + green regression); a **prompt/tool/model-version change requires a regression eval before redeploy**; **online sampling** via `IClock` (regression → alert → Health/Drift/Kill-switch); append-only evidence; gated not advisory; `EvalPort`. (REQ-EV-1..8)
- **15 Memory & Context (§15):** memory **tiers** (working/session/long-term/shared); **TTL/freshness** that **backs the Policy freshness gate and SDK `checkContextFreshness`** (promote the stub, **no contract change**); **provenance + poisoning** marking; **shared long-term write approval** (evidence + owner approval **routed through the HITL queue**); data classification; retention/deletion; `MemoryPort`. (REQ-MG-1..8)

## Integration wiring (do explicitly)
eval → Registry status-lifecycle transitions; eval → kill-switch reinstatement (real regression call); eval → Health eval-pass-rate; memory → Policy freshness gate (replace the Foundation stub); memory → SDK `checkContextFreshness`; memory → HITL queue.

## Definition of Done
**Scenarios P4-S1…P4-S10** all fire (promotion blocked by failing eval; second reviewer; model-version forces regression; injection gates safety; sampling drift alert; reinstatement uses real eval; stale context blocks via the freshness gate with no contract change; unverified shared-memory write routed to HITL; provenance/poisoning; Health eval-pass-rate populated). Mark Wave-2 domains **Tested**; note the platform is **agent-ready**; note Active steps.

---

# Phase 5 — Wave 3 (Digital Twin)

**Precondition:** Phase 4 green; build only once real telemetry/entity models exist (seeded twins reach Tested; Active needs a real twin). Read Wave 3 §16. This fills the null Health twin-fidelity-error metric and the twin-claim check in Drift.

## Tasks
- **16 Digital Twin (§16):** **twin registry** (entity, owner, DT level DT1–DT6, decision use case); **telemetry source register** (source, ingestion, measured quality, SoT); **advancement gate** (deterministic; blocks unless operating period + data quality + SoT + dashboard owner + decision use case + validation evidence + management approval); default timings as **configurable guidelines** (via `IClock`); **simulation restriction** for DT6; **fidelity validation record** (metric, ground-truth, calibration, tolerance, owner, use case, review frequency; incl. qualitative engineering validation); the **registered DT level is the authoritative claim**; append-only; `TwinPort`. (REQ-DT-1..10)

## Integration wiring (do explicitly)
twin → Health twin-fidelity-error (error vs tolerance); twin → Drift register comparison (a claim above the registered level → a deterministic drift finding, e.g. DT3 claimed as DT6).

## Definition of Done
**Scenarios P5-S1…P5-S6** all fire (advancement gate blocks; simulation restriction holds; dashboard-as-simulation caught as drift; Health twin-fidelity-error populated; configurable timing honored; fidelity record completeness). Mark Domain 16 **Tested**; record that **all 16 domains are built**; note the real-twin step to reach Active.

---

*End of Next.js / Drizzle Phases 2–5.*
