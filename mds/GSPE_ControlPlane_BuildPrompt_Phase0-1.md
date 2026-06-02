# Claude Code Build Prompt — GSPE OS Control Plane Platform

## Phases 0–1: Bootstrap + Walking Skeleton

> Paste this into Claude Code in a fresh, empty repository, with `GSPE_ControlPlane_SRS_Foundation.md` present at the repo root. The SRS is the single source of truth. This prompt drives the build; it does not restate the SRS — read it.

---

## Role and mission

You are a senior .NET backend engineer building the **GSPE OS Control Plane Platform** — the deterministic governance layer for GSPE OS. Your mission in this session is to deliver **Phase 0 (bootstrap)** and **Phase 1 (walking skeleton)** exactly as defined in the SRS, with passing tests and audit-grade records.

Do not build breadth. Build one governed action end-to-end through five sockets, plus the scaffolding that keeps the rest of the build coherent.

---

## Source of truth and reading order

1. Read `GSPE_ControlPlane_SRS_Foundation.md` in full once.
2. Then, for any task, re-read only the relevant section. Authoritative sections for this session:
   - Part 1 (System Core) — architecture, laws, cross-cutting requirements, tech decisions.
   - §4.3 (Policy & Gating Engine) and Appendix A (frozen contract) and Appendix B (governance matrix) — the centerpiece.
   - §4.1, §4.2, §4.4, §4.5, §4.7 — the other skeleton sockets, at the depth the skeleton needs.
   - Part 3 (Walking Skeleton) — the acceptance milestone.
3. If the SRS and this prompt ever conflict, the SRS wins. If the SRS is silent on a detail, make the smallest reasonable decision, implement it, and record it in `CLAUDE.md` under "Decisions" — never invent scope.

---

## Non-negotiable guardrails (from the SRS)

- **Modular monolith, vertical slices.** One solution, one deployable, one PostgreSQL database, **one schema per domain**. A domain may call another domain **only through its published port interface** — never via direct table access. (REQ-SC-1..5)
- **The Policy engine core is pure.** No I/O, no business-state mutation, no execution of the action. It returns a `PolicyDecision`. Persisting the decision and emitting the trace are done by the thin application boundary that wraps the engine. (REQ-PE-2)
- **Deterministic + fail-closed.** Same input → same output. For classes C2–C5, never return `ALLOW` on dependency failure or ambiguity. (REQ-SC-6, REQ-SC-7, REQ-PE-16)
- **No-trace → DENY.** Every gated action carries a `traceId`; absence is a hard deny. (REQ-SC-10, REQ-PE-4)
- **Idempotency.** Every mutating call takes an `idempotencyKey`; retries don't double-execute. (REQ-SC-11, REQ-SDK-3)
- **No local auth.** Authorization only, on top of Authentik/CTS identity. For this session, stub identity verification behind `IIdentityPort` with seeded test principals — but do not build a login system. (REQ-SC-14, REQ-ID-1)
- **Append-only records.** Decisions, traces, approvals are never overwritten. (REQ-SC-12)
- **The C4/C5 hard rule.** Financial and safety actions never auto-execute; never `ALLOW` for autonomy ≥ A3. Encode this as an explicit, separately-tested rule. (REQ-PE-9)
- **Governance matrix is data, not code.** Load it from the Registry as versioned data; the engine reads it. (REQ-RG-7, REQ-PE-19)

---

## PHASE 0 — Bootstrap

Deliver these before any feature code.

### 0.1 Solution scaffold
Create a .NET 8 solution as a modular monolith with vertical slices. Suggested layout:

```
/src
  /GspeOs.ControlPlane.Host            // ASP.NET Core minimal-API host, OpenAPI, DI wiring
  /GspeOs.ControlPlane.Shared          // cross-cutting: traceId, idempotency, problem-details, enums (C0-C5, A0-A5, status)
  /GspeOs.ControlPlane.Contracts       // FROZEN: PolicyDecisionRequest/PolicyDecision + all *Port interfaces
  /Domains
    /Identity                          // slice: handlers, EF model (schema: identity), IIdentityPort impl
    /Registry                          // slice: schema: registry, governance matrix store
    /Policy                            // slice: PURE engine core + thin boundary; schema: policy (decisions)
    /Tracing                           // slice: schema: tracing
    /Decision                          // slice: schema: decision
    /Interface                         // slice: schema: interface (scaffold only this phase)
  /Sdk
    /GspeOs.ControlPlane.Sdk.Dotnet    // .NET client; generated/derived from the OpenAPI doc
/tests
  /GspeOs.ControlPlane.Policy.Tests    // highest coverage: the eval cases from SRS §4.3.5
  /GspeOs.ControlPlane.Skeleton.Tests  // the end-to-end walking-skeleton acceptance tests
/GSPE_ControlPlane_SRS_Foundation.md
/CLAUDE.md
/ORCHESTRATOR.md
```

Use EF Core + Npgsql. Each domain's `DbContext` owns its own schema (`identity`, `registry`, `policy`, `tracing`, `decision`, `interface`). Wire one OpenAPI document in the Host.

### 0.2 Create `CLAUDE.md` (loaded every session — this matters more than the SRS day-to-day)
It must contain:
- Stack and versions (.NET 8, EF Core, PostgreSQL, Vue 3/PrimeVue planned frontend).
- Conventions: vertical-slice structure, ports-only cross-domain access, pure-engine rule, fail-closed rule, idempotency, append-only records, sentence-case, structured errors.
- Commands: build, run, test, apply migrations, regenerate SDK from OpenAPI.
- A "Decisions" log section (self-healing): every gap-filling decision you make gets one line with date and rationale. Update it as you go.
- A "Definition of Done" reminder: a control is Active only with test + audit log + real/test execution (REQ-SC-16).

### 0.3 Create `ORCHESTRATOR.md`
It must contain: the build sequence (REQ-SC-17), the per-phase reading order (which SRS sections to load for each domain), the phase list (this session = Phase 0 + Phase 1; later phases = complete Foundation, then Wave 1), and the rule that the Policy contract is frozen and changes to it require a contract-version bump.

### 0.4 FREEZE the Policy contract
In `GspeOs.ControlPlane.Contracts`, implement `PolicyDecisionRequest` and `PolicyDecision` exactly per **Appendix A**, plus the port interfaces `IIdentityPort`, `IRegistryPort`, `IPolicyEngine`, `ITracePort`, `IDecisionPort`, `IBudgetPort` (Budget is a Wave-1 stub returning "available"), `IApprovalPort` (Wave-1 stub writing a minimal approval record). Mark this assembly as the frozen contract in `CLAUDE.md`. Do not change these signatures later without a version bump and a note.

**Phase 0 is done when** the solution builds, migrations create the six schemas, the OpenAPI doc renders, and `CLAUDE.md` + `ORCHESTRATOR.md` + the frozen contract assembly exist.

---

## PHASE 1 — Walking skeleton

Implement only what the skeleton needs (SRS Part 3), wiring five sockets around one action: **PPC releases a Work Order (class C2).**

### 1.1 Registry (minimal)
- Seed the **governance matrix** (Appendix B) as versioned data with a `matrixVersion`.
- Seed the WO-release action type, one test agent (with an autonomy level), and one test tool in an allow-list.
- Implement `IRegistryPort`: `GetAgent`, `GetTool`, `IsToolAllowedForAgent`, `GetGovernanceMatrix`. (REQ-RG-1..7)

### 1.2 Identity (minimal)
- Seed test principals: one authorized user, one finance authority, one safety authority, one unauthorized user.
- Implement `IIdentityPort`: `ResolvePrincipal`, `HasAuthority`, `ApproverAuthorityFor`. Encode the segregation-of-duties check. (REQ-ID-1..6)

### 1.3 Policy & Gating Engine (the centerpiece — build this carefully)
- Implement `IPolicyEngine.Decide(...)` as a **pure function** running the eight A.R.T.E.F.A.C.T. checks in order A→R→T→E→F→A→C→T, short-circuiting on first hard DENY, always returning the full `checks` explanation, `obligations`, `resolvedActionClass`, `policyRulesetVersion`, and `matrixVersion`. (REQ-PE-1..21)
- Encode REQ-PE-9 (the C4/C5 hard rule) as its own explicit, separately-named rule with its own test.
- Risk resolution must validate any `declaredClass` and escalate on mismatch (REQ-PE-5).
- Then implement the thin **application boundary** (`PolicyDecisionService`) that: starts/uses the trace, calls the pure engine, persists the decision (Decision domain), records the trace event (Tracing domain), and returns the decision. The boundary does the I/O; the engine stays pure.

### 1.4 Tracing (minimal)
- Implement `ITracePort`: `StartTrace`, `RecordEvent`, `GetTrace`, append-only, keyed by `traceId`, capturing the fields in REQ-TR-2 that the skeleton produces.

### 1.5 Decision Records (minimal)
- Implement `IDecisionPort`: `RecordDecision` (with value-copy context snapshot in `jsonb`), `RecordExplanation`, `LinkApproval`, `RecordOutcome`. Maintain the link chain `traceId → decisionId → ...`. (REQ-DR-1..6)

### 1.6 SDK (.NET, minimal)
- Implement the .NET SDK methods needed by the skeleton: `CheckPolicy`, `EmitTrace`, `RecordDecision`, `RequestApproval` — each carrying `traceId` automatically and accepting `idempotencyKey` on mutations. Derive the client types from the OpenAPI doc. (REQ-SDK-1..6)

### 1.7 Wire the action
A test PPC caller uses the SDK to issue a WO-release `CheckPolicy` request, then honors the returned obligations (record decision; if `REQUIRE_APPROVAL`, call `RequestApproval` and link it).

---

## Phase 1 Definition of Done (acceptance — must all pass)

From SRS §5.4. A single WO-release request, all linked by one `traceId`, produces:
1. a trace record (Tracing),
2. a policy decision with full A.R.T.E.F.A.C.T. explanation + obligations (Policy),
3. a decision-journal entry with value-copy context (Decision),
4. on the approval path, a linked approval record (stub).

Automated tests that MUST be green:
- The full eval-case table from **SRS §4.3.5** (every row), as `Policy.Tests`.
- Two end-to-end `Skeleton.Tests`: one `ALLOW` path and one `REQUIRE_APPROVAL`/`DENY` path, asserting the four linked records exist and share the `traceId`.
- A determinism test: identical request → identical decision (excluding `decisionId`/timestamps).
- A fail-closed test: a C2 request with a simulated registry outage returns `DEGRADE`, never `ALLOW`.

Then update `CLAUDE.md` Decisions log and mark, in `ORCHESTRATOR.md`, the Policy engine and skeleton sockets as **Tested** (not yet Active — Active requires a real, non-test execution per REQ-SC-16).

---

## Working style

- Work in small, reviewable commits: scaffold → contract → one socket at a time → wire → tests.
- After each socket, run the build and tests before moving on.
- Prefer boring, explicit code over cleverness; the policy engine especially must be readable and obviously correct.
- Do not introduce Redis, Kafka, Temporal, or any heavy component this phase (REQ-SC-9).
- End the session with: a summary of what is Tested vs Designed, the test run output, and the exact commands to run the skeleton locally.
