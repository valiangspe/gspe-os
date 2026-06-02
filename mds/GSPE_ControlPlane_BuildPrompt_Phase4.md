# Claude Code Build Prompt — GSPE OS Control Plane Platform

## Phase 4: Wave 2 — Agent Readiness (Eval + Memory)

> Run this **after Phases 0–3** (the backend MVP is built and Tested). `GSPE_ControlPlane_SRS_Foundation.md`, `GSPE_ControlPlane_SRS_Wave1.md`, `GSPE_ControlPlane_SRS_Wave2.md`, `CLAUDE.md`, `ORCHESTRATOR.md`, and the frozen contract assembly all exist. This phase builds the gate before production agents; it does not rebuild earlier waves. (The admin console is a separate track; if it exists, its Eval/Memory areas are added in a console-extension, not here.)

---

## Role and mission

You are the senior .NET engineer continuing the **GSPE OS Control Plane Platform**. The MVP enforces; this phase makes the platform **safe to run production-grade agents**. Build the two Wave-2 domains — the **Evaluation Harness & Promotion Gates** and **Memory & Context Governance** — and wire them into the seams the earlier waves left open, so promotion becomes evidence-gated and context becomes fresh and trustworthy.

This is the gate before autonomy above A2. Building it does not itself promote any agent — that is a real-world operational step.

---

## Source of truth and reading order

1. Re-read `CLAUDE.md` and `ORCHESTRATOR.md`.
2. Authoritative SRS sections:
   - Foundation Part 1 (System Core, all laws bind), §4.2 Registry (status lifecycle REQ-RG-4), §4.3 Policy + Appendix A (the freshness gate REQ-PE-12 and the **frozen contract — do not change it**), §4.7 SDK (`CheckContextFreshness`).
   - Wave 1 §8 (kill-switch reinstatement REQ-KS-5), §10 (HITL queue — shared-memory write approval routes here), §13 (Health eval-pass-rate REQ-HM-1).
   - `GSPE_ControlPlane_SRS_Wave2.md` Part 6 — §14 Eval harness, §15 Memory governance, §6.0.1 (AI impact assessment as gate evidence).
3. SRS wins over this prompt on conflict. Fill silence with the smallest reasonable decision and log it in `CLAUDE.md` → Decisions.

---

## Guardrails (unchanged — they still bind)

Modular monolith, vertical slices, **ports-only** access. Policy engine core **pure**, contract **frozen** (bump version only if forced, with a logged note). **Deterministic + fail-closed** for C2–C5. **No-trace → DENY.** **Idempotency** on every mutation. **No local auth.** **Append-only** records. Governance matrix is **versioned data**. The **C4/C5 hard rule** (REQ-PE-9) stays separately tested. The **injectable clock** (`IClock`, from Phase 3) is reused for online-sampling cadence. No Redis/Kafka/Temporal unless the SRS forces it (REQ-SC-9).

---

## Preconditions to verify

- The Phase 3 enforcement suite is green (the nine enforcement scenarios).
- The Registry status lifecycle exists; the kill-switch reinstatement currently accepts a **manual regression-evidence link**; the Policy freshness gate is currently backed by a **Foundation stub**; the Health eval-pass-rate metric is currently **null**. This phase replaces all three with real Wave-2 services.
If a precondition fails, fix it first and note it in `CLAUDE.md`.

---

## Phase 4 tasks

### 4.1 Domain 14 — Evaluation Harness & Promotion Gates (SRS §14)
- Maintain **golden datasets** per agent (versioned with the agent). (REQ-EV-1)
- Implement the eval **suites**: correctness, safety/red-team (**including prompt-injection cases**), schema/format validity, tool-use correctness, cost/latency, and regression — each returning pass/fail against thresholds plus a score. (REQ-EV-2)
- Implement the **AI impact assessment** as structured evidence (the v3.5 dimensions) attached to the promotion decision and stored against the Registry agent record (REQ-EV per §6.0.1).
- Implement **promotion gates** as deterministic transitions:
  - `Designed → Tested`: impact assessment complete + eval-suite pass + **tested kill-switch** (Domain 8). (REQ-EV-3)
  - `Tested → Active`: owner approval + **second reviewer** (segregation, REQ-ID-4) + green regression. (REQ-EV-3)
- A **prompt / tool / model-version change** SHALL require a regression eval before redeploy (treat a model-version bump as a behavior change). (REQ-EV-4)
- Implement **online sampling** evals on production agents (cadence via `IClock`); an eval-score regression raises an alert, feeds Health (REQ-HM-1), and MAY trigger Drift (Domain 11) or a kill-switch escalation (Domain 8). (REQ-EV-5)
- Store eval results as **append-only evidence** linked to the agent and the promotion decision, traced. Promotion is **gated, not advisory** — block when thresholds fail. (REQ-EV-6, REQ-EV-7)
- Expose `IEvalPort`: `RunEvalSuite`, `GetEvalResult`, `CheckPromotionGate`, `RecordPromotionDecision`. (REQ-EV-8)

### 4.2 Domain 15 — Memory & Context Governance (SRS §15)
- Implement memory **tiers** — working, session, long-term, shared — each with a declared scope registered in the Registry memory registry. (REQ-MG-1)
- Enforce **TTL / freshness**: every item carries `asOf` + TTL; stale items are flagged. (REQ-MG-2)
- Enforce **provenance**: every item carries a provenance tag (source + trust level); externally-sourced memory is marked **untrusted** (poisoning protection) and is not authoritative. (REQ-MG-3)
- Enforce **shared long-term write approval**: no unverified agent output is written to shared long-term memory; promotion requires evidence + owner approval. (REQ-MG-4)
- Enforce **data classification** on memory (REQ-PE-14) and **retention/deletion** per UU PDP / ISO / legal (REQ-SC-13). (REQ-MG-5, REQ-MG-6)
- A read of stale context **blocks or escalates** a real recommendation; shared-memory writes are logged with provenance and traced. (REQ-MG-7)
- Expose `IMemoryPort`: `Read`, `Write` (with provenance + `idempotencyKey`), `CheckFreshness`, `RequestSharedWriteApproval`. (REQ-MG-8)

### 4.3 Integration wiring (the seams Wave 2 promotes — do these explicitly)
1. **Eval → Registry status lifecycle:** the `Designed → Tested` and `Tested → Active` transitions now call `IEvalPort.CheckPromotionGate`; a failing gate blocks the transition.
2. **Eval → Kill-switch reinstatement:** REQ-KS-5's "regression eval passed" now calls `IEvalPort` (the regression suite) instead of accepting a manual evidence link.
3. **Eval → Health:** the eval-pass-rate metric (REQ-HM-1), null until now, reads real data from `IEvalPort`.
4. **Memory → Policy freshness gate:** `IMemoryPort.CheckFreshness` **replaces the Foundation freshness stub** behind the Policy engine's freshness gate (REQ-PE-12) — **without changing the frozen contract**.
5. **Memory → SDK:** the SDK's `CheckContextFreshness` now routes to `IMemoryPort`.
6. **Memory → HITL queue:** shared-memory write approval (REQ-MG-4) routes through the HITL approval queue (Domain 10), where owner approval is required.

---

## Deferred to their own phases (do not build now)
- **Wave 3** — Digital Twin maturity (Domain 16).
- **Real-world Active steps:** real agent promotions, real stale-context blocks in production, and actually raising any agent's autonomy above A2 in a controlled workflow.
- The **Eval and Memory areas of the admin console** — a console-extension, not this backend phase.

---

## Phase 4 Definition of Done (acceptance — these must fire for real in tests)

The suite MUST include, all green:
1. **Promotion blocked by a failing eval.** An agent with a failing correctness or safety suite cannot transition `Designed → Tested`; the transition is refused and the reason recorded.
2. **Tested → Active needs a second reviewer.** The transition is refused without a second reviewer (segregation).
3. **Model-version change forces regression.** Bump an agent's model version → redeploy/promotion is blocked until a regression eval passes.
4. **Injection cases gate safety.** An agent failing prompt-injection cases fails the safety suite (and thus the gate).
5. **Online sampling detects drift.** With `IClock`, inject an eval-score regression on a production agent → an alert is raised and the Health eval-pass-rate reflects it.
6. **Reinstatement now uses a real eval.** The Phase-3 kill-switch reinstatement path now calls `IEvalPort` for the regression check rather than accepting a manual link.
7. **Stale context blocks a recommendation.** A context item past its TTL → the Policy freshness gate yields `DENY`/`REQUIRE_APPROVAL` via `IMemoryPort.CheckFreshness` — confirmed with **no change to the frozen contract**.
8. **Unverified shared-memory write blocked.** A write to shared long-term memory without approval is refused; promotion requires evidence + owner approval **routed through the HITL queue**.
9. **Provenance/poisoning.** An externally-sourced memory item is marked untrusted and is not treated as authoritative.
10. **Health eval-pass-rate populated.** The metric that was null in Phase 3 now returns real data.

Then update `CLAUDE.md` Decisions; in `ORCHESTRATOR.md`, mark Wave-2 domains **Tested**, note that the platform is now **agent-ready** (production promotion is possible, gated by eval + memory), and record the remaining real-execution steps to mark each **Active** per REQ-SC-16.

---

## Working style
- Small, reviewable commits: build the Eval harness and its promotion-gate wiring first (it unblocks safe promotion), then Memory governance and the freshness wiring; tests after each.
- Keep the Policy engine and its frozen contract untouched — Wave 2 plugs into the freshness gate and status lifecycle that already exist.
- End the session with: a Tested-vs-Active status table for all 15 built domains, the test run output (highlighting the ten Phase-4 scenarios), and the commands to run the agent-readiness demo locally.
