# Claude Code Build Prompt — GSPE OS Control Plane Console

## Extension: Wave 2/3 console areas (Eval, Memory, Twin)

> Run this **after the admin console exists** (`GSPE_ControlPlane_BuildPrompt_AdminConsole.md`) and after the relevant backends are built: the **Eval** and **Memory** areas need Phase 4 (Wave 2); the **Twin** area needs Phase 5 (Wave 3). Build the areas whose backends exist — you do not need all three at once. This extends the existing console; it builds no backend logic.

---

## Role and mission

You are the senior frontend engineer extending the **GSPE OS Control Plane Console**. The console already operates the MVP (Registry, Policy, Approval, Decision/Observability, Enforcement, Health, Governance). Your mission is to add three more areas — **Eval**, **Memory/Context**, and **Twin** — each consuming the real API, role-aware, and status-honest, slotting into the existing shell and nav.

These three areas are about **maturity honesty** more than any others: they show whether agents are safe to promote, whether context is trustworthy, and whether a twin is what it claims to be. The UI must never inflate that.

---

## Source of truth and reading order

1. Re-read `CLAUDE.md`, `ORCHESTRATOR.md`, and `GSPE_ControlPlane_BuildPrompt_AdminConsole.md` — reuse its shell, auth, role-aware nav, shared empty/loading/error components, and the **anti-rubber-stamp approval pattern**.
2. The **OpenAPI document is the contract.** Use the **generated TypeScript SDK client** for every call; never hand-roll requests or invent endpoints. If a screen needs data the API does not expose, stop and note it in `CLAUDE.md` → Decisions rather than faking it.
3. Backend SRS sections that shape these areas:
   - Wave 2 §14 Eval harness & promotion gates (`IEvalPort`), §15 Memory & context governance (`IMemoryPort`), §6.0.1 (AI impact assessment as gate evidence).
   - Wave 1 §10 HITL queue (shared-memory write approvals route here) and §11 Drift (twin-claim findings surface here).
   - Wave 3 §16 Twin maturity & fidelity (`ITwinPort`).

---

## Stack and patterns (inherited — do not re-decide)

Vue 3 (`<script setup>`, Composition API) + Vite + TypeScript · PrimeVue 4 **Aura** + Tailwind · Pinia · Vue Router · the generated **TS SDK client** · Authentik OIDC · PrimeVue `Chart` for any charts. Reuse the existing shell, auth store, and shared components — these areas are new routes added to the role-aware nav, not a new app.

---

## Guardrails and UI principles (same doctrine, applied here)

- **Role-aware, always.** Only authorized roles trigger an eval-driven promotion, act as a second reviewer, approve a shared-memory write, or approve a twin advancement. Never render an action the backend would refuse.
- **Status-honest — no maturity inflation.** Show an agent's real control status and a twin's real DT level. Never present an agent as production-ready when its promotion gates fail, and never present a twin above its registered level. These areas exist to keep claims honest — the UI must not become a drift source itself.
- **Anti-rubber-stamp on approvals.** Shared-memory write approval reuses the evidence-confirmation pattern from the Approval console (tick the specific evidence reviewed; a single click is not allowed).
- **Audit-grade, trace-linked, no fabricated data.** Bind to real responses; empty states say "no data"; errors correlate by `traceId`.
- **Sentence case, accessible, PrimeVue components configured not disfigured.**

---

## Preconditions to verify

- The admin console shell + auth + role-aware nav exist and work.
- For Eval/Memory: the Phase 4 backend (`IEvalPort`, `IMemoryPort`) is running and Tested. For Twin: the Phase 5 backend (`ITwinPort`) is running and Tested.
Build only the areas whose backend exists; if one is missing, skip its area and note it.

---

## Tasks

### CE.1 Eval console (Domain 14) — *needs Phase 4*
- **Agent eval overview:** per agent/version, the golden dataset and the latest suite results — correctness, safety/red-team (**including injection**), schema, tool-use, cost/latency, regression — each with pass/fail vs threshold and a score.
- **Run a suite:** authorized users trigger `RunEvalSuite` and see results stream/refresh; results are read-only evidence afterward.
- **Promotion gate view (the centerpiece):** for a chosen transition (`Designed → Tested`, `Tested → Active`), show pass/fail per requirement and **exactly what is blocking** — impact assessment complete? eval pass? tested kill-switch? owner approval? second reviewer? green regression? Only authorized roles can trigger the promotion or act as second reviewer.
- **AI impact assessment:** view/record the structured assessment (v3.5 dimensions) attached to the promotion decision.
- **Online sampling / drift:** show the eval-score trend (PrimeVue `Chart`) and any drift alerts; link a drift alert to Governance (Domain 11) or Enforcement (Domain 8) where the backend connected them.
- **Status honesty:** the agent's real status is shown prominently; a failing gate is unmistakably "cannot promote," never dressed up as ready.

### CE.2 Memory / Context console (Domain 15) — *needs Phase 4*
- **Memory stores by tier:** working / session / long-term / **shared**, each with scope and owner (from the Registry memory registry).
- **Freshness view:** items with `asOf` + TTL; **stale items flagged**; show that stale context is what blocks/escalates a recommendation at the Policy freshness gate. A "check freshness" action calls `CheckFreshness`.
- **Provenance & poisoning:** every item shows its provenance tag and trust level; **externally-sourced / untrusted memory is clearly marked** and labeled non-authoritative.
- **Shared-memory write approval:** show pending shared long-term writes with their value, provenance, and evidence. Approval **routes through the HITL queue** (Domain 10): surface the request and its status here with a deep-link to the queue item, and reuse the **evidence-confirmation** approval pattern; only an authorized owner can approve. (Do not duplicate the approval engine — link to it.)
- **Data classification & retention:** restricted-data memory shows its access control and retention class.

### CE.3 Twin console (Domain 16) — *needs Phase 5*
- **Twin registry:** each twin with entity, owner, **current DT level (DT1–DT6)**, and decision use case; show the DT1–DT6 ladder so the registered level is unmistakable.
- **Telemetry source register:** data source, ingestion method, measured data quality, SoT.
- **Advancement gate view (the centerpiece):** for a chosen advancement (e.g. DT3 → DT4, or a DT6 attempt), show pass/fail per criterion and **what is blocking** — operating period met? data quality? SoT? dashboard owner? decision use case? validation evidence? management approval? For a DT6 attempt, surface the **simulation-restriction** conditions explicitly. Only management-authorized roles can approve an advancement; default timings are shown as guidelines that management may adjust with a recorded rationale.
- **Fidelity validation:** view/record the fidelity record (metric, ground-truth source, calibration, tolerance, validation owner, decision use case, review frequency); show measured **error vs tolerance** (this is what feeds the Health twin-fidelity-error metric).
- **Claim honesty:** the registered DT level is authoritative; a twin claimed above its level surfaces here with a link to the Governance Drift finding (Domain 11). A dashboard (DT3) is never shown as a simulation twin.

---

## Deferred / notes
- This phase is **UI only.** If a screen needs data the API doesn't expose, fix it in a backend phase — never fake it.
- Build only the areas whose backend exists; the Twin area can be added later than Eval/Memory.

---

## Definition of Done (acceptance — operate Wave 2/3 through the UI)

For each area whose backend exists, all against the real API:

**Eval**
1. An authorized user runs a suite and reads results; an unauthorized user cannot trigger a promotion or act as second reviewer.
2. The promotion gate view shows a **blocked** promotion and names exactly what blocks it; status honesty holds (a failing-gate agent is not shown as production-ready).

**Memory**
3. Items render by tier with **freshness** and **provenance**; a stale item is flagged and an untrusted item is marked non-authoritative.
4. A shared-memory write approval **requires evidence confirmation** and is shown routing through the HITL queue; an unauthorized owner cannot approve.

**Twin**
5. Twins render with their **DT level**; the advancement gate view shows a **blocked** advancement (e.g. a DT6 attempt refused without fidelity validation/management approval) and names what blocks it.
6. A twin claimed above its registered level surfaces with a link to its Drift finding; fidelity **error vs tolerance** is displayed.

**All built areas**
7. The new areas appear in the **role-aware nav** only for permitted roles; empty/loading/error states present; **no hardcoded data**; the app builds and lints clean.

Then update `CLAUDE.md` Decisions and note in `ORCHESTRATOR.md` which console areas now exist (UI track extended for the built waves).

---

## Working style
- Small, reviewable commits: one area at a time (Eval and Memory first if Phase 4 is done; Twin once Phase 5 is done), each wired to the real SDK before moving on.
- Reuse the existing shell, auth, and approval patterns — do not reinvent them.
- End the session with: the areas built, a short screen-by-screen description, the acceptance checklist results, and the commands to run the extended console.
