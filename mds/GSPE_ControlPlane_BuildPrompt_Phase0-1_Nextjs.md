# Claude Code Build Prompt — GSPE OS Control Plane Platform (Next.js / Drizzle variant)

## Phases 0–1: Bootstrap + Walking Skeleton

> Use this **instead of** `GSPE_ControlPlane_BuildPrompt_Phase0-1.md` if you adopt the Next.js / Drizzle stack. Paste into Claude Code in a fresh, empty repo with `GSPE_ControlPlane_SRS_Foundation.md` **and** `GSPE_ControlPlane_SRS_TechVariant_NextjsDrizzle.md` present. The SRS is the source of truth; the tech variant replaces §2.3.

---

## Role and mission

You are a senior TypeScript engineer building the **GSPE OS Control Plane Platform** — the deterministic governance layer for GSPE OS — on **Next.js (App Router) + Drizzle + PostgreSQL**. Deliver **Phase 0 (bootstrap)** and **Phase 1 (walking skeleton)** exactly as the SRS defines, with passing tests and audit-grade records. Build one governed action end-to-end through five sockets, plus the scaffolding that keeps the rest coherent. Do not build breadth.

---

## Source of truth and reading order

1. Read `GSPE_ControlPlane_SRS_Foundation.md` in full, then `GSPE_ControlPlane_SRS_TechVariant_NextjsDrizzle.md` (it replaces §2.3).
2. For any task, re-read only the relevant section: Part 1 (System Core), §4.3 + Appendix A/B (Policy engine, frozen contract, governance matrix), §4.1/§4.2/§4.4/§4.5/§4.7 (the other sockets), Part 3 (walking skeleton).
3. The SRS wins on conflict. Fill silence with the smallest reasonable decision, implement it, and log it in `CLAUDE.md` → Decisions — never invent scope.

---

## Non-negotiable guardrails (SRS laws, in the TS idiom)

- **Modular monolith, vertical slices.** One Next.js app, one PostgreSQL database, **one Postgres schema per domain**. A domain imports another domain's **`port.ts` only** — never its `schema.ts`/tables. (REQ-SC-1..3)
- **The Policy engine core is pure.** `domains/policy/engine.ts` exports a pure `decide(request, context)` with **no DB, no `fetch`, no I/O**. The boundary fetches identity/registry data, passes it in as `context`, then persists the decision and records the trace. (REQ-PE-2)
- **Deterministic + fail-closed.** Same input → same output; for C2–C5 never return `ALLOW` on dependency failure or ambiguity. (REQ-SC-6/7, REQ-PE-16)
- **No-trace → DENY.** Every gated action carries a `traceId`; absence is a hard deny. Carry trace context via `AsyncLocalStorage`. (REQ-SC-10, REQ-PE-4)
- **Idempotency.** Every mutating handler/SDK call takes an `idempotencyKey`; retries don't double-execute. (REQ-SC-11)
- **No local auth.** Authorization only over Authentik/CTS. For this session, stub identity verification behind `IdentityPort` with seeded test principals — do not build login. (REQ-SC-14)
- **Append-only records** (decisions, traces, approvals): insert-only Drizzle patterns, no updates on audit tables. (REQ-SC-12)
- **C4/C5 hard rule:** never `ALLOW` for autonomy ≥ A3 on financial/safety actions — its own named function with its own test. (REQ-PE-9)
- **Governance matrix is data, not code:** load it from the Registry as versioned data. (REQ-RG-7)

---

## PHASE 0 — Bootstrap

### 0.1 Monorepo scaffold (pnpm)
```
/apps
  /control-plane                    // Next.js App Router
    /src
      /domains
        /identity                   // schema.ts (pg schema: identity), port.ts, service, handlers, tests
        /registry                   // schema.ts (registry), governance-matrix store
        /policy                     // engine.ts (PURE), boundary.ts, schema.ts (policy: decisions)
        /tracing                    // schema.ts (tracing)
        /decision                   // schema.ts (decision)
        /interface                  // scaffold only this phase
      /shared                       // traceId + AsyncLocalStorage, idempotency, problem-details, enums (C0-C5, A0-A5, status), IClock
      /app/api/...                  // route handlers = the control-plane API
/packages
  /contracts                        // FROZEN: Zod PolicyDecisionRequest/PolicyDecision + all *Port interfaces; z.infer types; zod-to-openapi setup
  /db                               // Drizzle client; aggregates per-domain schemas; drizzle-kit config
  /sdk                              // TS SDK client (checkPolicy/emitTrace/recordDecision/requestApproval) + idempotency
/tests                              // Vitest
/CLAUDE.md
/ORCHESTRATOR.md
/GSPE_ControlPlane_SRS_Foundation.md
/GSPE_ControlPlane_SRS_TechVariant_NextjsDrizzle.md
```
Use Drizzle + Npgsql/pg; each domain's `schema.ts` declares its tables under a dedicated Postgres schema; `packages/db` aggregates them for `drizzle-kit` migrations. One OpenAPI document is generated from the Zod contracts and served (Swagger UI).

### 0.2 Create `CLAUDE.md` (loaded every session — matters more than the SRS day-to-day)
Stack and versions (Next.js, TypeScript strict, Drizzle, PostgreSQL, React/shadcn planned console); conventions (vertical-slice structure, **ports-only via `port.ts`**, pure-engine rule, fail-closed, idempotency, append-only, sentence-case, problem-details errors); commands (dev, build, test via Vitest, `drizzle-kit` migrate, regenerate SDK/OpenAPI from Zod); a self-healing **Decisions** log; and the **Definition of Done** reminder (Active only with test + audit + real execution, REQ-SC-16).

### 0.3 Create `ORCHESTRATOR.md`
The build sequence (REQ-SC-17), the per-phase reading order, the phase list (this session = Phase 0 + 1), and the rule that the Policy contract is frozen — changes require a contract-version bump and a note.

### 0.4 FREEZE the Policy contract (as Zod)
In `packages/contracts`, define `PolicyDecisionRequest` and `PolicyDecision` as **Zod schemas exactly per Appendix A**, export `z.infer` types, and wire `zod-to-openapi`. Define the port interfaces `IdentityPort`, `RegistryPort`, `PolicyEngine`, `TracePort`, `DecisionPort`, `BudgetPort` (Wave-1 stub returning "available"), `ApprovalPort` (Wave-1 stub writing a minimal approval record). Mark this package frozen in `CLAUDE.md`; do not change these shapes later without a version bump.

### 0.5 Enforce the boundary in lint
Add an **ESLint boundary rule** (e.g. `eslint-plugin-boundaries`) so any import of another domain's `schema.ts`/tables (anything but its `port.ts`) **fails lint**. This is the TS-world equivalent of "no cross-domain table access."

**Phase 0 is done when** the app builds, `drizzle-kit` creates the six schemas, the OpenAPI doc renders from Zod, the boundary lint rule is active, and `CLAUDE.md` + `ORCHESTRATOR.md` + the frozen `contracts` package exist.

---

## PHASE 1 — Walking skeleton

Implement only what the skeleton needs (SRS Part 3), wiring five sockets around **PPC releases a Work Order (class C2)**.

### 1.1 Registry (minimal)
- Seed the **governance matrix** (Appendix B) as versioned data with a `matrixVersion`; seed the WO-release action type, one test agent (with autonomy), one allowed tool.
- Implement `RegistryPort`: `getAgent`, `getTool`, `isToolAllowedForAgent`, `getGovernanceMatrix`. (REQ-RG-1..7)

### 1.2 Identity (minimal)
- Seed test principals: authorized user, finance authority, safety authority, unauthorized user.
- Implement `IdentityPort`: `resolvePrincipal`, `hasAuthority`, `approverAuthorityFor`; encode the segregation-of-duties check. (REQ-ID-1..6)

### 1.3 Policy & Gating Engine (centerpiece)
- Implement `decide(request, context)` in `engine.ts` as a **pure function** running the eight A.R.T.E.F.A.C.T. checks in order A→R→T→E→F→A→C→T, short-circuiting on first hard DENY, always returning the full `checks` explanation, `obligations`, `resolvedActionClass`, `policyRulesetVersion`, `matrixVersion`. (REQ-PE-1..21)
- Encode REQ-PE-9 (C4/C5 hard rule) as its own named function + test; validate any `declaredClass` and escalate on mismatch (REQ-PE-5).
- Implement the thin **boundary** (`boundary.ts`) that gathers identity authority + registry data into `context`, calls the pure engine, persists the decision (Decision domain), records the trace (Tracing domain), and returns the decision. The boundary does I/O; the engine stays pure.

### 1.4 Tracing (minimal)
- Implement `TracePort`: `startTrace`, `recordEvent`, `getTrace`; append-only; keyed by `traceId`; capture the REQ-TR-2 fields the skeleton produces; use `AsyncLocalStorage` for context.

### 1.5 Decision Records (minimal)
- Implement `DecisionPort`: `recordDecision` (value-copy context snapshot in `jsonb`), `recordExplanation`, `linkApproval`, `recordOutcome`; maintain the `traceId → decisionId → …` chain. (REQ-DR-1..6)

### 1.6 SDK (TS, minimal)
- Implement the SDK methods the skeleton needs — `checkPolicy`, `emitTrace`, `recordDecision`, `requestApproval` — each auto-propagating `traceId` and requiring `idempotencyKey` on mutations; types derived from `packages/contracts`. (REQ-SDK-1..6)

### 1.7 Wire the action
A test PPC caller uses the SDK to issue a WO-release `checkPolicy` request, then honors the returned obligations (record decision; if `REQUIRE_APPROVAL`, call `requestApproval` and link it).

---

## Phase 1 Definition of Done (acceptance — all must pass, Vitest)

A single WO-release request, all linked by one `traceId`, produces: a trace record, a policy decision with the full A.R.T.E.F.A.C.T. explanation + obligations, a decision-journal entry with value-copy context, and (on the approval path) a linked approval record (stub). (SRS §5.4)

Tests that must be green:
- The full eval-case table from **SRS §4.3.5** (every row) as `policy.test.ts`.
- Two end-to-end `skeleton.test.ts`: one `ALLOW` path, one `REQUIRE_APPROVAL`/`DENY` path, asserting the four linked records share the `traceId`.
- A determinism test: identical request → identical decision (excluding ids/timestamps).
- A fail-closed test: a C2 request with a simulated registry outage returns `DEGRADE`, never `ALLOW`.
- The boundary ESLint rule actually fails on a deliberate cross-domain table import (then remove the test import).

Then update `CLAUDE.md` Decisions and mark, in `ORCHESTRATOR.md`, the Policy engine and skeleton sockets **Tested** (not Active — Active needs real, non-test execution per REQ-SC-16).

---

## Working style
- Small, reviewable commits: scaffold → frozen contract + lint boundary → one socket at a time → wire → tests; run build + Vitest after each.
- The Policy engine must be readable and obviously correct; keep it pure.
- No Redis/Kafka/Temporal this phase (REQ-SC-9).
- End the session with: a Tested-vs-Designed summary, the Vitest output, and the exact commands to run the skeleton locally.
