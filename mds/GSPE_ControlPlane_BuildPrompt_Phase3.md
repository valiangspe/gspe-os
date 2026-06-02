# Claude Code Build Prompt — GSPE OS Control Plane Platform

## Phase 3: Wave 1 Enforcement (and the v3.6 MVP)

> Run this **after Phase 0–2** in the same repository. The Foundation wave is complete and Tested, `GSPE_ControlPlane_SRS_Foundation.md` and `GSPE_ControlPlane_SRS_Wave1.md` are present, and `CLAUDE.md` / `ORCHESTRATOR.md` / the frozen contract assembly exist. This phase builds enforcement on top; it does not rebuild Foundation.

---

## Role and mission

You are the senior .NET engineer continuing the **GSPE OS Control Plane Platform**. Foundation governs passively — it can decide, trace, and record. Your mission now is to make the control plane **enforce**: stop bad agents, cap cost, route real human approvals, and surface health. Build the six Wave-1 domains per the SRS extension, prioritizing the MVP subset, and prove enforcement actually fires.

Reaching the end of the MVP subset (Domains 8, 9, 10, 13) means **Foundation + these four = the v3.6 11-domain MVP**: a usable, enforcing control plane. Treat that as a milestone.

---

## Source of truth and reading order

1. Re-read `CLAUDE.md` (conventions + Decisions log) and `ORCHESTRATOR.md` (sequence) first.
2. Authoritative SRS sections:
   - `GSPE_ControlPlane_SRS_Foundation.md` Part 1 (System Core) — all laws still bind. §4.2 Registry (status lifecycle), §4.3 Policy engine + Appendix A (the cost gate REQ-PE-15 and the frozen contract — **do not change it**), §4.5 Decision (link chain), §4.7 SDK.
   - `GSPE_ControlPlane_SRS_Wave1.md` Part 5 — §8 Kill-switch, §9 Budget, §10 HITL queue, §11 Drift, §12 Weak-signal, §13 Health. Build order per §5.0.1.
3. SRS wins over this prompt on conflict. Fill silence with the smallest reasonable decision and log it in `CLAUDE.md` → Decisions.

---

## Guardrails (unchanged — they still bind)

Modular monolith, vertical slices, **ports-only** cross-domain access. Policy engine core stays **pure** and its contract stays **frozen** (REQ-PE-2; bump version only if forced, with a logged note). **Deterministic + fail-closed** for C2–C5. **No-trace → DENY.** **Idempotency** on every mutation. **No local auth** — authorization over Authentik/CTS. **Append-only** records. Governance matrix is **versioned data** in Registry. The **C4/C5 hard rule** (REQ-PE-9) stays separately tested. No Redis/Kafka/Temporal unless the SRS forces it (REQ-SC-9).

**One new rule for this phase:** make the **system clock injectable** (an `IClock` abstraction) so SLA timeouts, the 30/90-day weak-signal cycles, and the monthly drift scan can be tested deterministically.

---

## Preconditions to verify before starting

- The Foundation Phase 2 suite is green, including the full-Foundation demo scenario, and the invariant tests (idempotency, fail-closed, append-only).
- `IBudgetPort` and `IApprovalPort` currently exist as **stubs**. This phase promotes them to real implementations **without changing their signatures**.
If any precondition fails, fix it first and note it in `CLAUDE.md`.

---

## Phase 3 tasks (build in this order)

### 3.1 Domain 8 — Kill-Switch & Escalation Service (SRS §8)
- Implement the three-level **state machine**: Soft Stop (agent → A0), Functional Stop (one workflow/tool), Hard Stop (full suspension). (REQ-KS-1)
- Enforce **stop authority** via Identity (Agent Owner → Soft; OS PM → Soft/Functional; AI Governance → Functional/Hard; ISMS → Hard; Director → any). (REQ-KS-2)
- Implement `RaiseEscalation` accepting triggers from monitoring, the Policy boundary, or manual report, routed per the escalation protocol. (REQ-KS-3)
- **Wire the integration that makes a stop real:** applying a stop updates the **Registry control status** to `Suspended`/reduced scope (Domain 2); the Policy engine already reads agent status from Registry, so a stopped agent's out-of-scope actions now resolve to `DENY`. (REQ-KS-4)
- Implement the **reinstatement workflow** with root-cause record (Decision domain), a recorded regression-test evidence link (the Wave-2 Eval harness does not exist yet), and a **second reviewer** for safety/security stops (REQ-ID-4). (REQ-KS-5)
- Accept runaway/loop signals that auto-trigger at least a Functional Stop; support multi-agent suspension. (REQ-KS-6, REQ-KS-7)
- All events append-only, traced, linked to incident + decision. Expose `IKillSwitchPort`. (REQ-KS-8, REQ-KS-9)

### 3.2 Domain 9 — Budget & Circuit-Breaker Service (SRS §9)
- Meter usage via SDK `ReportCostUsage`; attribute across company/per-agent/per-module/per-department with the declared attribution rule. (REQ-BC-1, REQ-BC-5)
- Implement breakers: 80% yellow → 95% approval-required → 100% suspend non-deterministic → emergency override (Director). (REQ-BC-2)
- **Promote `IBudgetPort.CheckBudget` from stub to real** so the Policy engine's cost gate (REQ-PE-15) returns real results: over-budget yields the configured restriction and never silently allows a non-deterministic action over a hard stop. **No contract change.** (REQ-BC-3)
- Enforce the **continue/pause split** during a budget stop: the deterministic control plane continues; the reasoning plane pauses unless approved (REQ-BC-4). All breaker events append-only and traced. (REQ-BC-6)

### 3.3 Domain 10 — HITL Approval Queue (SRS §10)
- **Promote `IApprovalPort` from stub to a real queue.** Items are created from Policy decisions of outcome `REQUIRE_APPROVAL` via the SDK's `RequestApproval`; capture action, principal, evidence, risk class, requested autonomy, deadline. (REQ-HQ-1)
- **Route by risk class** to the `requiredApproverAuthority` from the decision, validated via Identity; refuse unauthorized approvers. (REQ-HQ-2)
- Enforce SLA + timeout: C1 expire/hold; C2–C3 expire/hold + re-queue; **C4–C5 fail-closed always** (use `IClock`). (REQ-HQ-3)
- Enforce **anti-rubber-stamp**: approver confirms specific evidence fields (not one click); sample-audit; track approve-without-override rate (feeds Domains 11 + 13). Batch low-risk; never batch C4/C5. (REQ-HQ-4, REQ-HQ-5)
- Backup approver + escalation for overdue/high-risk. On approval, **link the approval to the originating decision** (Decision link chain) and trace; only then may the caller proceed. (REQ-HQ-6, REQ-HQ-7)
- Expose `IApprovalPort`. (REQ-HQ-8)

> **Milestone after 3.3 + 3.4:** Foundation + Domains 8, 9, 10, 13 = the v3.6 11-domain MVP. Record this in `ORCHESTRATOR.md`.

### 3.4 Domain 13 — OS Health Metrics & Dashboard (backend) (SRS §13)
- Compute the leading indicators (acceptance rate, override rate, escalation frequency, mean-time-to-kill, cost per decision, interface SLA adherence, HITL queue latency, approve-without-override rate, incident/near-miss count; eval-pass-rate and twin-fidelity left as null until Waves 2–3). (REQ-HM-1)
- Each metric has an **owner** and **cadence**; red/yellow thresholds raise an assigned action (escalate to Domain 8 where apt). Do not add a metric with no owner and no triggered action. (REQ-HM-2)
- Read from Tracing/Decision/HITL/Kill-switch/Budget/Drift/Weak-signal **via ports only**; store append-only metric snapshots. (REQ-HM-3, REQ-HM-4)
- Expose `IHealthPort`. The Vue dashboard UI is a **separate phase** — build the metrics API and one minimal JSON/health endpoint only. (REQ-HM-5)

### 3.5 Domain 11 — Capability-Claim Drift Detection (SRS §11) — after MVP subset
- Maintain the claim→evidence table. (REQ-DD-1)
- The authoritative check is the **deterministic register comparison** (claim vs Registry status, evidence links, kill-switch existence, eval/twin records where present). (REQ-DD-2)
- LLM-assisted document scanning is a **helper only**, always confirmed against the register. (REQ-DD-3)
- Implement the drift-response workflow and a **scheduled monthly scan** (via `IClock`); findings linked to object + owner, fed to Health. Expose `IDriftPort`. (REQ-DD-4, REQ-DD-5, REQ-DD-6)

### 3.6 Domain 12 — Weak-Signal Validation (SRS §12) — after MVP subset
- Store the weak-signal record; enforce the workflow with **30-day and 90-day timers** (via `IClock`); decisions recorded in the Decision Journal. (REQ-WS-1, REQ-WS-2)
- Deprioritize a source after three barren cycles. Surface a weekly review list. Expose `IWeakSignalPort`. (REQ-WS-3, REQ-WS-4, REQ-WS-5)

---

## Deferred to their own phases (do not build now)
- The **Vue 3 / PrimeVue admin console** (its own UI phase) — build only backend APIs here.
- **Wave 2** (Eval harness 14, Memory governance 15) and **Wave 3** (Twin maturity 16).
- Real-world rollout steps required to mark domains **Active** (real stop on a real agent, real metered spend, two real apps on the SDK).

---

## Phase 3 Definition of Done (acceptance — these must fire for real in tests)

The point of this phase is enforcement that actually acts. The suite MUST include, all green:

1. **Stopped agent is denied.** Apply a Hard Stop → the agent's next gated action resolves to `DENY` via the Policy engine reading Registry status. A Soft-Stopped agent can read (C0) but a recommend/act resolves to `DENY`.
2. **Reinstatement requires a second reviewer** for a safety/security stop; a single-reviewer reinstatement is refused (REQ-ID-4).
3. **Budget breaker fires through the existing cost gate.** Drive usage to 100% → a non-deterministic action that previously returned `ALLOW` now returns the configured restriction via `IBudgetPort` — with **no change to the frozen contract**. A deterministic control-plane action still proceeds (the continue/pause split).
4. **A C4 approval routes to a finance authority.** A C4 `REQUIRE_APPROVAL` decision creates a queue item routed to a FINANCE authority; approval by a non-authorized approver is refused; on valid approval the record links into the Decision chain and the action may proceed.
5. **C4/C5 timeout fails closed.** Advance `IClock` past the SLA on a C5 item → it does **not** auto-execute.
6. **Anti-rubber-stamp.** An approval without confirmed evidence fields is rejected; the approve-without-override metric increments.
7. **Health reflects reality.** With activity from multiple domains, the metrics API returns live values and a threshold breach raises an assigned action.
8. **Drift (deterministic).** A claim of "Active" against an agent whose Registry status is `Tested` produces a drift finding from the register comparison (no LLM required).
9. **Weak-signal cycle.** Using `IClock`, a signal advances through its 30-day classification and 90-day outcome review; a barren source is deprioritized after three cycles.

Then update `CLAUDE.md` Decisions log; in `ORCHESTRATOR.md`, mark Wave-1 domains **Tested**, record the **MVP-reached** milestone after the subset, and note the remaining real-execution steps to mark each **Active** per REQ-SC-16.

---

## Working style
- Small, reviewable commits: one domain to completion at a time, tests after each; build the MVP subset (8, 9, 10, 13) first and pause to confirm the MVP scenario before 11 and 12.
- Keep the Policy engine and its frozen contract untouched; the whole point is that Wave 1 plugs into the seams Foundation already exposes.
- End the session with: a Tested-vs-Active status table for all 13 built domains, the test run output (highlighting the nine enforcement scenarios), and the commands to run the MVP enforcement demo locally.
