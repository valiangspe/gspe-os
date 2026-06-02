# Claude Code Build Prompt — GSPE OS Control Plane Platform

## Admin Console (Vue 3 / PrimeVue) — operate the MVP

> Run this **after Phases 0–3** (the backend MVP is built and Tested). It can run in the same repository under `/frontend`, or in a separate repo that points at the platform API. `GSPE_ControlPlane_SRS_Foundation.md`, `GSPE_ControlPlane_SRS_Wave1.md`, `CLAUDE.md`, `ORCHESTRATOR.md`, the OpenAPI document, and the generated **TypeScript SDK client** all exist. This phase builds the UI on top of them; it builds **no** new backend logic.

---

## Role and mission

You are a senior frontend engineer building the **GSPE OS Control Plane Console** — one unified admin interface for the whole control plane. Per the doctrine, this is **one console, not 16 UIs**. Your mission is a console that lets authorized humans operate the MVP: see the registry, view and simulate policy decisions, work the approval queue, search traces and decisions, apply kill-switches, watch budgets, and read OS health — all role-aware and status-honest.

Build console areas only for domains that already exist (Foundation + Wave 1). Do not build Memory, Eval, or Twin consoles.

---

## Source of truth and reading order

1. Re-read `CLAUDE.md` and `ORCHESTRATOR.md`.
2. The **OpenAPI document is the API contract.** Use the **generated TypeScript SDK client** for every call — do not hand-write fetch/axios calls or invent endpoints. If a screen needs data the API does not expose, stop and note it in `CLAUDE.md` → Decisions rather than faking it.
3. SRS sections that shape the UI: Foundation §4.1 (roles/authorities), §4.2 (registry + status lifecycle), §4.3 + Appendix A/B (decision shape, A0–A5, C0–C5, governance matrix), §4.5 (decision/explanation chain), §4.6 (interfaces); Wave 1 §8 (kill-switch levels/authority), §9 (budget breakers), §10 (approval queue + anti-rubber-stamp), §11 (drift), §12 (weak-signal), §13 (health metrics).

---

## Stack decision

| Concern | Decision |
|---|---|
| Framework | Vue 3 (`<script setup>`, Composition API) + Vite + TypeScript |
| UI kit | PrimeVue 4, **Aura** theme, + Tailwind (matches your existing WME/internal-app stack) |
| State | Pinia |
| Routing | Vue Router |
| API | The **generated TypeScript SDK client** (from the OpenAPI doc) — single source of truth, no drift |
| Auth | Authentik OIDC (Authorization Code + PKCE); the platform already validates the token (Phase 2). The console authenticates the user and attaches the token via the SDK |
| Charts | PrimeVue `Chart` (Chart.js) for the health dashboard — no extra chart dependency |

---

## Guardrails and UI principles (these encode the doctrine in the interface)

- **Role-aware, always.** Read the signed-in user's roles/authorities from Identity. Show only permitted actions: only a FINANCE authority sees Approve on a C4 item; only ISMS/AI-Governance/Director see the higher kill-switch levels; viewers see read-only. Never render an action the backend would refuse.
- **Status-honest — no claim inflation.** Show control status exactly (`Proposed / Designed / Tested / Active / Suspended / Retired`) with a clear visual distinction. Never label something "Active" that the API reports as Tested. The console must not become a capability-claim drift source.
- **Audit-grade and read-heavy.** Most screens are inspection. Every record links by `traceId`; make the trace the connective tissue (a decision links to its explanation, its approval, its evidence, its trace).
- **Enforce evidence confirmation in approvals (anti-rubber-stamp).** The Approve action SHALL require the approver to tick the specific evidence fields reviewed — a single "Approve" click is not allowed (REQ-HQ-4). Never batch C4/C5.
- **No fabricated or placeholder data.** Bind to real API responses. Empty states say "no data," not fake rows. Loading and error states are explicit and correlate errors by `traceId`.
- **Sentence case, accessible** (labels, ARIA, keyboard nav, contrast). PrimeVue components configured, not restyled into something unrecognizable.
- The dashboard exists to **drive decisions**, not to decorate — every metric shows its owner and, on a red/yellow breach, the assigned action.

---

## Preconditions to verify

- The backend MVP (Foundation + Domains 8, 9, 10, 13) is running and Tested; Drift (11) and Weak-signal (12) APIs exist.
- The OpenAPI doc renders and the TypeScript SDK client builds against it.
If a precondition fails, note it and proceed only against what the API actually exposes.

---

## Tasks

### C.0 Console shell + auth
- Scaffold the Vite + Vue 3 + TS app under `/frontend`; install PrimeVue 4 (Aura) + Tailwind + Pinia + Vue Router; wire the generated TS SDK client with a base-URL config and the OIDC token attached to requests.
- Implement **Authentik OIDC login** (Auth Code + PKCE), token storage, silent refresh, and logout. On load, fetch the user's principal (roles, department, authorities) into a Pinia `auth` store.
- Build the app shell: top bar (user + role + sign-out), a **role-aware left nav** listing only the console areas the user may access, and a content router-view. Empty/loading/error patterns as shared components.

### C.1 Registry console (Domains 1, 2, 6)
- List + detail for **agents** (purpose, owner, autonomy A0–A5, allowed tools, status, version) and **tools** (full tool contract: side-effect class, schemas, reversibility, permissions, version).
- Show the **status lifecycle** with allowed transitions surfaced only to authorized roles; transitions call the SDK.
- View the **governance matrix** (Appendix B) read-only with its `matrixVersion`; edits are an authorized, change-controlled action where the API allows.
- Identity sub-view: roles, departments, and the authority matrix (read-only unless authorized).
- Interface Contract Register view: interfaces with health (green/yellow/red) and SLA.

### C.2 Policy console (Domain 3) — mostly read + simulate
- A **decision simulator**: build a `PolicyDecisionRequest` (principal, action, class, tool, context, evidence) and call `CheckPolicy`; render the returned `PolicyDecision` clearly — outcome, resolved class, obligations, and the ordered A.R.T.E.F.A.C.T. **checks explanation** (each check's status + rule). Show `policyRulesetVersion` and `matrixVersion`.
- A reference view of the A0–A5 and C0–C5 ladders and the gating matrix, so operators understand decisions.

### C.3 Approval console (Domain 10) — the interactive core
- The **pending queue** filtered to the signed-in user's authorities (a FINANCE authority sees finance items, etc.); columns: action, principal, risk class, requested autonomy, deadline/SLA countdown.
- A detail drawer showing the linked decision, its explanation, and **evidence**. The **Approve** action requires ticking the specific evidence fields reviewed before it enables (anti-rubber-stamp); Reject requires a reason. Unauthorized approvers never see the action.
- Show SLA state and **fail-closed** badges for C4/C5; surface overdue + escalation. Never batch C4/C5.
- On approval, confirm the link into the decision chain and the trace.

### C.4 Decision & observability console (Domains 4, 5)
- **Decision Journal** list + detail: what was decided, by whom, value-copy context, linked explanation, approval, evidence, and outcome review.
- **Explanation Log** view tied to each decision.
- **Trace search/inspect**: query by traceId, principal, application, workflow, time window, outcome; a trace detail timeline showing gate results, tool calls, approval, and **cost/token usage**.

### C.5 Enforcement console (Domains 8, 9)
- **Kill-switch panel**: list agents with current stop state; apply Soft / Functional / Hard stop **only at the levels the user's authority permits** (REQ-KS-2), with reason capture; show the reinstatement workflow state (and the second-reviewer requirement for safety/security stops).
- **Escalations** list with trigger, owner, and action.
- **Budget breakers**: current usage vs budgets per company/agent/module/department; threshold state (80/95/100); breaker event history.

### C.6 Health dashboard console (Domain 13)
- Render the leading indicators from `IHealthPort` as cards/charts (PrimeVue `Chart`): acceptance rate, override rate, escalation frequency, mean-time-to-kill, cost per decision, interface SLA adherence, HITL queue latency, **approve-without-override rate**, incident/near-miss count. Leave eval-pass-rate and twin-fidelity as "not yet available."
- Each metric tile shows its **owner** and cadence; a red/yellow breach shows the **assigned action** and links to the relevant console (e.g. escalation → Enforcement).

### C.7 Governance & intelligence console (Domains 11, 12)
- **Drift findings**: list from the register comparison with claim, evidence gap, affected object, owner, and the response action; mark resolved.
- **Weak-signal watch-list**: signals with owner, potential impact, 30-day classification, 90-day outcome; show deprioritized sources.

---

## Deferred to their own phases (do not build now)
- **Memory / Context console** (Wave 2, Domain 15) and **Eval console** (Wave 2, Domain 14).
- **Twin console** (Wave 3, Domain 16).
- Any backend logic — this phase is UI only; if data is missing, fix the gap in a backend phase, not by faking it.

---

## Definition of Done (acceptance — operate the MVP through the UI)

A signed-in, appropriately-authorized user can, all against the real API:
1. **Log in via Authentik** and see a nav scoped to their role.
2. **Register an agent**, give it an autonomy level and an allowed tool, and move it through the status lifecycle — with status displayed honestly.
3. **Simulate a policy decision** and read the full A.R.T.E.F.A.C.T. explanation, obligations, and resolved class.
4. **Approve a C4 item** only after confirming evidence fields; verify an **unauthorized approver cannot** (the action isn't offered, and a forced call is refused); see the approval linked into the decision chain.
5. **Search and open a trace**, following it to its decision, explanation, approval, and cost.
6. **Apply a kill-switch** at a permitted level with a reason, then confirm (via the Policy simulator) the stopped agent's action now resolves to `DENY`.
7. **Read the health dashboard** with live values and see a red/yellow breach surface its owner and assigned action.
8. **Status honesty check:** no screen labels any domain or control "Active" that the API reports as Tested.

Plus: role-aware menu verified for at least two roles; empty/loading/error states present; no hardcoded data; the app builds and lints clean. Update `CLAUDE.md` Decisions; note in `ORCHESTRATOR.md` that the console operates the MVP (UI track complete for Foundation + Wave 1).

---

## Working style
- Small, reviewable commits: shell + auth first, then one console area at a time, each wired to the real SDK before moving on.
- Reuse PrimeVue components and shared empty/loading/error patterns; keep the design clean and consistent, not heavily restyled.
- End the session with: the list of console areas built, screenshots or a short screen-by-screen description, the acceptance checklist results, and the commands to run the console against a local platform.
