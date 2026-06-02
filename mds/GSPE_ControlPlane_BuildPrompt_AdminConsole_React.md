# Claude Code Build Prompt — GSPE OS Control Plane Console (React / shadcn variant)

## Admin Console — operate the MVP

> Use this **instead of** `GSPE_ControlPlane_BuildPrompt_AdminConsole.md` if you adopt the Next.js / Drizzle stack and want a single-ecosystem console. Run **after Phases 0–3** (Next.js variant) — the backend MVP exists and Tested, the OpenAPI doc and the generated **TypeScript SDK client** exist. Same screens, same doctrine, React idiom. UI only — no new backend logic.

---

## Role and mission

You are a senior frontend engineer building the **GSPE OS Control Plane Console** in React — **one unified admin interface**, not 16 UIs. It lets authorized humans operate the MVP: see the registry, view and simulate policy decisions, work the approval queue, search traces and decisions, apply kill-switches, watch budgets, and read OS health — role-aware and status-honest. Build console areas only for domains that exist (Foundation + Wave 1).

---

## Source of truth and reading order

1. Re-read `CLAUDE.md`, `ORCHESTRATOR.md`, and `GSPE_ControlPlane_SRS_TechVariant_NextjsDrizzle.md`.
2. The **OpenAPI document is the contract.** Use the **generated TypeScript SDK client** for every call via TanStack Query — never hand-roll requests or invent endpoints. If a screen needs data the API does not expose, stop and note it in `CLAUDE.md` → Decisions rather than faking it.
3. SRS sections shaping the UI: Foundation §4.1 (roles/authorities), §4.2 (registry + status lifecycle), §4.3 + Appendix A/B (decision shape, A0–A5, C0–C5, matrix), §4.5 (decision/explanation chain), §4.6 (interfaces); Wave 1 §8 (kill-switch), §9 (budgets), §10 (approval + anti-rubber-stamp), §11 (drift), §12 (weak-signal), §13 (health).

---

## Stack decision

| Concern | Decision |
|---|---|
| Framework | React via **Next.js (App Router)**, TypeScript strict; console pages under `app/(console)/…` in the control-plane app (or a separate `apps/console` in the monorepo) |
| UI kit | **shadcn/ui** (`pnpm dlx shadcn@latest add`) + Tailwind; shadcn **Sidebar** for nav, **Table** (+ TanStack Table), **Dialog/Sheet**, **Card**, **Badge**, **Sonner** toasts |
| Server state | **TanStack Query** over the generated TS SDK client (caching, mutations, optimistic updates, idempotency keys) |
| Client state | **Zustand** (+ `useImmer` where helpful) for auth, filters, selections |
| Forms | **react-hook-form + zod resolver**, validating against the shared `packages/contracts` Zod schemas (the decision simulator and the API share one schema) |
| Charts | shadcn **Chart** (Recharts) for the health dashboard |
| Auth | **Auth.js (NextAuth)** with **Authentik** as the OIDC provider (cookie session); attach the token to SDK calls; fetch the principal (roles, department, authorities) into the Zustand auth store on login |

---

## Guardrails and UI principles (the doctrine, in the interface)

- **Role-aware, always.** Show only permitted actions: only a FINANCE authority sees Approve on a C4 item; only ISMS/AI-Governance/Director see higher kill-switch levels; viewers are read-only. Never render an action the backend would refuse.
- **Status-honest — no claim inflation.** Show control status exactly (`Proposed/Designed/Tested/Active/Suspended/Retired`) with clear visual distinction; never label something "Active" that the API reports as Tested.
- **Audit-grade, trace-linked.** Every record links by `traceId`; make the trace the connective tissue (decision → explanation → approval → evidence → trace).
- **Enforce evidence confirmation in approvals (anti-rubber-stamp).** Approve requires ticking the specific evidence fields reviewed — a single click is not allowed; never batch C4/C5.
- **No fabricated/placeholder data.** Bind to real responses; empty states say "no data"; explicit loading/error states correlate errors by `traceId`.
- **Sentence case, accessible** (ARIA, keyboard nav, contrast); shadcn components configured, not disfigured.
- The dashboard exists to **drive decisions** — every metric shows its owner and, on a red/yellow breach, the assigned action.

---

## Preconditions
- The backend MVP (Foundation + Domains 8, 9, 10, 13) runs and is Tested; Drift (11) and Weak-signal (12) APIs exist.
- The OpenAPI doc renders and the TS SDK client builds. If a precondition fails, proceed only against what the API exposes.

---

## Tasks

### C.0 Shell + auth
Scaffold the console (Next.js app or `apps/console`); install shadcn/ui + Tailwind + Zustand + TanStack Query; wire the generated TS SDK client with base-URL config and the OIDC token. Implement **Auth.js + Authentik OIDC** (cookie session), refresh, logout; on load fetch the principal into a Zustand `auth` store. Build the shell: top bar (user + role + sign-out), a **role-aware shadcn Sidebar** listing only accessible areas, a content area, and shared empty/loading/error components.

### C.1 Registry console (Domains 1, 2, 6)
List + detail (shadcn Table + Sheet) for **agents** (purpose, owner, autonomy A0–A5, allowed tools, status, version) and **tools** (full contract: side-effect class, schemas, reversibility, permissions, version). Show the **status lifecycle** with transitions surfaced only to authorized roles. View the **governance matrix** (Appendix B) read-only with `matrixVersion`. Identity sub-view: roles, departments, authority matrix (read-only unless authorized). Interface Register: interfaces with health (green/yellow/red) + SLA.

### C.2 Policy console (Domain 3) — read + simulate
A **decision simulator**: a react-hook-form built from the `PolicyDecisionRequest` Zod schema; submit calls `checkPolicy`; render the `PolicyDecision` — outcome, resolved class, obligations, and the ordered **A.R.T.E.F.A.C.T. checks** (each status + rule), with `policyRulesetVersion`/`matrixVersion`. A reference view of the A0–A5 / C0–C5 ladders and the gating matrix.

### C.3 Approval console (Domain 10) — interactive core
The **pending queue** filtered to the user's authorities; columns: action, principal, risk class, requested autonomy, SLA countdown. A detail Sheet showing the linked decision, explanation, and evidence; **Approve enables only after ticking the specific evidence fields reviewed** (anti-rubber-stamp); Reject requires a reason; unauthorized approvers never see the action. Show SLA state and **fail-closed** badges for C4/C5; surface overdue + escalation; never batch C4/C5. On approval, confirm the link into the decision chain + trace.

### C.4 Decision & observability console (Domains 4, 5)
**Decision Journal** list + detail (what, by whom, value-copy context, linked explanation/approval/evidence/outcome). **Explanation Log** per decision. **Trace search/inspect**: query by traceId/principal/app/workflow/time/outcome; a trace timeline showing gate results, tool calls, approval, and cost/token usage.

### C.5 Enforcement console (Domains 8, 9)
**Kill-switch panel**: agents with current stop state; apply Soft/Functional/Hard **only at permitted levels** with reason capture; show reinstatement state (and the second-reviewer requirement for safety/security stops). **Escalations** list (trigger, owner, action). **Budget breakers**: usage vs budgets per company/agent/module/department; threshold state (80/95/100); breaker history.

### C.6 Health dashboard console (Domain 13)
Render leading indicators (shadcn Chart/Recharts): acceptance rate, override rate, escalation frequency, mean-time-to-kill, cost per decision, interface SLA adherence, HITL queue latency, **approve-without-override rate**, incident/near-miss; eval-pass-rate and twin-fidelity shown "not yet available." Each tile shows its **owner** + cadence; a red/yellow breach shows the **assigned action** and links to the relevant area.

### C.7 Governance & intelligence console (Domains 11, 12)
**Drift findings**: claim, evidence gap, affected object, owner, response action; mark resolved. **Weak-signal watch-list**: signals with owner, potential impact, 30-day classification, 90-day outcome; show deprioritized sources.

---

## Deferred
Memory/Eval/Twin console areas (the React ConsoleExtension prompt); any backend logic. If data is missing, fix the backend, don't fake it.

---

## Definition of Done (operate the MVP through the UI)

A signed-in, appropriately-authorized user can, against the real API:
1. **Log in via Authentik** and see a role-scoped sidebar.
2. **Register an agent**, set autonomy + allowed tool, move it through the status lifecycle — status shown honestly.
3. **Simulate a policy decision** and read the full A.R.T.E.F.A.C.T. explanation, obligations, resolved class.
4. **Approve a C4 item** only after confirming evidence; verify an **unauthorized approver cannot** (action not offered + forced call refused); see it linked into the decision chain.
5. **Search and open a trace**, following it to decision, explanation, approval, cost.
6. **Apply a kill-switch** at a permitted level with a reason, then confirm via the simulator that the stopped agent's action resolves to `DENY`.
7. **Read the health dashboard** with live values; a red/yellow breach surfaces its owner + assigned action.
8. **Status honesty:** no screen labels anything "Active" that the API reports as Tested.

Plus: role-aware sidebar verified for ≥2 roles; empty/loading/error states present; no hardcoded data; app builds + lints clean (including the boundary rule if in the monorepo). Update `CLAUDE.md` Decisions; note in `ORCHESTRATOR.md` that the console operates the MVP.

---

## Working style
Small, reviewable commits: shell + auth first, then one area at a time, each wired to the real SDK via TanStack Query before moving on. Reuse shadcn components + shared empty/loading/error patterns; keep the design clean, not heavily restyled. End with: areas built, a screen-by-screen description, acceptance results, and the commands to run the console against a local platform.
