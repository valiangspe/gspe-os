# Claude Code Build Prompt — GSPE OS Control Plane Console (React / shadcn variant)

## Extension: Wave 2/3 console areas (Eval, Memory, Twin)

> Use this **instead of** `GSPE_ControlPlane_BuildPrompt_ConsoleExtension_Wave2-3.md` if you adopt the Next.js / Drizzle stack with the React console. Run **after the React admin console exists** and after the relevant backends: **Eval** and **Memory** need Phase 4; the **Twin** area needs Phase 5. Build the areas whose backends exist. UI only — no backend logic.

---

## Role and mission

You are the senior frontend engineer extending the **GSPE OS Control Plane Console** (React). It already operates the MVP. Add three areas — **Eval**, **Memory/Context**, and **Twin** — consuming the real API, role-aware, and **status-honest**, slotting into the existing shell and sidebar. These areas are about **maturity honesty** above all: whether agents are safe to promote, whether context is trustworthy, whether a twin is what it claims. The UI must never inflate that.

---

## Source of truth and reading order

1. Re-read `CLAUDE.md`, `ORCHESTRATOR.md`, and `GSPE_ControlPlane_BuildPrompt_AdminConsole_React.md` — reuse its shell, Auth.js setup, role-aware sidebar, shared empty/loading/error components, TanStack Query patterns, and the **anti-rubber-stamp approval pattern**.
2. The **OpenAPI document is the contract**; use the **generated TS SDK client** via TanStack Query. Never hand-roll requests or invent endpoints; if data is missing, note it in `CLAUDE.md` → Decisions, don't fake it.
3. Backend SRS sections: Wave 2 §14 (Eval, `IEvalPort`), §15 (Memory, `IMemoryPort`), §6.0.1 (impact assessment as gate evidence); Wave 1 §10 (HITL queue — shared-memory writes route here), §11 (Drift — twin-claim findings); Wave 3 §16 (Twin, `ITwinPort`).

---

## Stack and patterns (inherited — do not re-decide)
React + Next.js + TypeScript · **shadcn/ui** + Tailwind · **Zustand** (client) + **TanStack Query** (server) · the generated **TS SDK client** · **Auth.js + Authentik** · shadcn **Chart** (Recharts) · react-hook-form + zod resolver against `packages/contracts`. New areas are new routes added to the role-aware sidebar — not a new app.

---

## Guardrails and UI principles (same doctrine)
- **Role-aware:** only authorized roles trigger an eval-driven promotion, act as second reviewer, approve a shared-memory write, or approve a twin advancement.
- **Status-honest — no maturity inflation:** show an agent's real status and a twin's real DT level; never present a failing-gate agent as production-ready or a twin above its registered level. These areas keep claims honest — the UI must not become a drift source.
- **Anti-rubber-stamp:** shared-memory write approval reuses the evidence-confirmation pattern (tick the specific evidence; single click not allowed).
- **Audit-grade, trace-linked, no fabricated data;** sentence case, accessible, shadcn configured not disfigured.

---

## Preconditions
For Eval/Memory: Phase 4 backend (`IEvalPort`, `IMemoryPort`) runs and is Tested. For Twin: Phase 5 backend (`ITwinPort`) runs and is Tested. Build only the areas whose backend exists; skip and note any missing one.

---

## Tasks

### CE.1 Eval console (Domain 14) — *needs Phase 4*
- **Agent eval overview:** per agent/version, the golden dataset and latest suite results — correctness, safety/red-team (**including injection**), schema, tool-use, cost/latency, regression — each with pass/fail vs threshold + score (shadcn Table + Card).
- **Run a suite:** authorized users trigger `runEvalSuite` (TanStack mutation); results stream/refresh, then are read-only evidence.
- **Promotion gate view (centerpiece):** for a transition (`Designed → Tested`, `Tested → Active`), show pass/fail per requirement and **exactly what blocks** — impact assessment? eval pass? tested kill-switch? owner approval? second reviewer? green regression? Only authorized roles trigger promotion or act as second reviewer.
- **AI impact assessment:** view/record the structured assessment (v3.5 dimensions) attached to the promotion decision.
- **Online sampling / drift:** eval-score trend (shadcn Chart) + drift alerts; link to Governance (11) or Enforcement (8) where connected.
- **Status honesty:** the agent's real status is prominent; a failing gate is unmistakably "cannot promote."

### CE.2 Memory / Context console (Domain 15) — *needs Phase 4*
- **Memory stores by tier:** working / session / long-term / **shared**, each with scope + owner.
- **Freshness view:** items with `asOf` + TTL; **stale items flagged**; a "check freshness" action calls `checkFreshness`; convey that stale context is what blocks/escalates at the Policy freshness gate.
- **Provenance & poisoning:** every item shows provenance + trust level; **externally-sourced/untrusted memory clearly marked** non-authoritative.
- **Shared-memory write approval:** pending shared long-term writes with value, provenance, evidence; approval **routes through the HITL queue** (Domain 10) — surface the request + status with a deep-link to the queue item, reusing the **evidence-confirmation** pattern; only an authorized owner approves. Do not duplicate the approval engine — link to it.
- **Data classification & retention:** restricted-data memory shows access control + retention class.

### CE.3 Twin console (Domain 16) — *needs Phase 5*
- **Twin registry:** each twin with entity, owner, **current DT level (DT1–DT6)**, decision use case; show the DT1–DT6 ladder so the registered level is unmistakable.
- **Telemetry source register:** source, ingestion method, measured data quality, SoT.
- **Advancement gate view (centerpiece):** for an advancement (e.g. DT3 → DT4, or a DT6 attempt), show pass/fail per criterion and **what blocks** — operating period? data quality? SoT? dashboard owner? decision use case? validation evidence? management approval? For DT6, surface the **simulation-restriction** conditions explicitly. Only management-authorized roles approve; default timings shown as adjustable guidelines (with recorded rationale).
- **Fidelity validation:** view/record the fidelity record (metric, ground-truth, calibration, tolerance, owner, use case, review frequency); show **error vs tolerance** (feeds the Health twin-fidelity metric).
- **Claim honesty:** the registered DT level is authoritative; a twin claimed above its level surfaces with a link to its Governance Drift finding (Domain 11); a dashboard (DT3) is never shown as a simulation twin.

---

## Deferred / notes
UI only. If a screen needs data the API doesn't expose, fix the backend, never fake it. Build only areas whose backend exists; Twin can come later than Eval/Memory.

---

## Definition of Done (operate Wave 2/3 through the UI)

For each built area, against the real API:

**Eval** — (1) an authorized user runs a suite and reads results; an unauthorized user cannot trigger a promotion or act as second reviewer. (2) The promotion gate view shows a **blocked** promotion and names what blocks it; a failing-gate agent is not shown as production-ready.

**Memory** — (3) items render by tier with **freshness** + **provenance**; a stale item is flagged and an untrusted item marked non-authoritative. (4) A shared-memory write approval **requires evidence confirmation** and is shown routing through the HITL queue; an unauthorized owner cannot approve.

**Twin** — (5) twins render with their **DT level**; the advancement gate view shows a **blocked** advancement (e.g. a DT6 attempt refused without fidelity validation/approval) and names what blocks it. (6) A twin claimed above its level surfaces with a link to its Drift finding; fidelity **error vs tolerance** is displayed.

**All built areas** — (7) the new areas appear in the **role-aware sidebar** only for permitted roles; empty/loading/error states present; **no hardcoded data**; app builds + lints clean.

Then update `CLAUDE.md` Decisions and note in `ORCHESTRATOR.md` which console areas now exist.

---

## Working style
Small, reviewable commits: one area at a time (Eval + Memory first if Phase 4 is done; Twin once Phase 5 is done), each wired to the real SDK via TanStack Query before moving on. Reuse the existing shell, Auth.js, and approval patterns — don't reinvent them. End with: areas built, a screen-by-screen description, acceptance results, and the commands to run the extended console.
