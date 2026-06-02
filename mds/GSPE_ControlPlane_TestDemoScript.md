# GSPE OS Control Plane — Test & Demo Script

## Standardized acceptance verification for every phase

> One reference for how each phase is **proven**. Every phase has two artifacts: an **automated suite** (the gate → marks the phase **Tested**) and a **demo script** (a human-visible walkthrough → supports marking domains **Active** once run against real data). Scenarios consolidate the acceptance criteria from the build prompts and the SRS. Stack-neutral: fill the command placeholders per your stack.

---

## Conventions

- **Scenario IDs:** `P{phase}-S{n}` for backend phases; `C-S{n}` (admin console) and `CE-S{n}` (console extension) for UI.
- **Each scenario** has steps to run/show and a single pass criterion. Many map directly to SRS `REQ-*` acceptance and Definition-of-Done items.
- **Command placeholders** (set the real ones in `CLAUDE.md`):
  - `<test>` — run the suite (.NET: `dotnet test`; Next.js: `pnpm test` / `vitest`).
  - `<run>` — run the platform locally (.NET: `dotnet run`; Next.js: `pnpm dev`).
  - `<e2e>` — run UI end-to-end (Playwright).
  - `<migrate>` — apply migrations (EF Core / `drizzle-kit`).
- **Regression rule:** each phase's gate **re-runs all prior phases' suites**. A later wave must never break an earlier one.
- **Tested vs Active (REQ-SC-16):** the suite green = **Tested**. **Active** additionally needs the demo run against real (or controlled-real) data plus the three evidence links (test · audit · real execution) recorded in the status tracker's Evidence log. Never mark Active from tests alone.

### Phase sign-off checklist (copy per phase)
- [ ] Phase suite green (`<test>`)
- [ ] Regression: all prior suites green
- [ ] Demo script run and observed
- [ ] Status tracker updated (domains → Tested; Active only with real-execution evidence)
- [ ] `CLAUDE.md` → Decisions updated; frozen-contract line current

---

## Phase 0 — Bootstrap (structural checks)

| # | Check | Pass criterion |
|---|---|---|
| P0-1 | Build | The solution/app builds clean |
| P0-2 | Migrations (`<migrate>`) | The six domain schemas are created (identity, registry, policy, tracing, decision, interface) |
| P0-3 | OpenAPI | The OpenAPI document renders (from attributes / from Zod) |
| P0-4 | Scaffolding | `CLAUDE.md`, `ORCHESTRATOR.md`, and the frozen contract (assembly/package) exist; the Policy contract is marked frozen |
| P0-5 | Boundary (Next.js) | The ESLint boundary rule is active |

---

## Phase 1 — Walking skeleton
**Demo narrative:** "Release a Work Order and watch it get gated, explained, and traced."

| # | Scenario | Run / show | Pass criterion |
|---|---|---|---|
| P1-S1 | Eval table | `<test>` policy suite | Every SRS §4.3.5 row returns its specified outcome (ALLOW/REQUIRE_APPROVAL/DENY/DEGRADE) |
| P1-S2 | End-to-end ALLOW | Submit a permitted WO-release `checkPolicy` | ALLOW; a trace and a decision are recorded; they share one `traceId` |
| P1-S3 | End-to-end gate | Submit a C2 WO-release with a high-autonomy agent | REQUIRE_APPROVAL (or DENY); approval stub linked; the four records share the `traceId` |
| P1-S4 | Determinism | Submit the identical request twice | Identical decision (excluding ids/timestamps) |
| P1-S5 | Fail-closed | C2 request with a simulated registry outage | DEGRADE — never ALLOW |
| P1-S6 | No-trace | Request without a `traceId` | DENY (reason: no-trace) |
| P1-S7 | Boundary (Next.js) | Add a deliberate cross-domain table import | Lint fails (then remove the import) |

---

## Phase 2 — Complete Foundation
**Demo narrative:** "Register an agent and its tool, run several action classes through Policy, record the decisions, log an interface handoff, then query the traces back."

| # | Scenario | Pass criterion |
|---|---|---|
| P2-S1 | Foundation FRs | All Foundation suites green |
| P2-S2 | Status lifecycle | An agent moves Proposed → Designed → Tested with only the allowed transitions; illegal transitions refused |
| P2-S3 | Multi-class | A C0 ALLOW, a C2 REQUIRE_APPROVAL, and a C4 DENY all resolve correctly through Policy via the SDK |
| P2-S4 | Decisions | Each decision is recorded with its explanation and a value-copy context snapshot |
| P2-S5 | Interface | A handoff is recorded with health status against SLA |
| P2-S6 | Trace query | Traces are queryable by traceId / principal / application / workflow / time / outcome |
| P2-S7 | Auth | Authentik token and CTS credential validation are exercised (test issuer/JWKS) |
| P2-S8 | Idempotency | A retried mutation produces no duplicate effect |
| P2-S9 | Append-only | An attempt to mutate an audit record is refused (insert-only) |
| P2-S10 | SDK | Other-language clients build; the REST fallback is documented |

---

## Phase 3 — Wave 1 enforcement (→ MVP)
**Demo narrative:** "A misbehaving agent is stopped and then denied; a budget breaker fires and changes a decision; a payment approval routes to a finance authority."

| # | Scenario | Pass criterion |
|---|---|---|
| P3-S1 | Stopped agent denied | After a Hard Stop, the agent's next gated action resolves to DENY; after a Soft Stop, a C0 read ALLOWs but a recommend/act DENYs |
| P3-S2 | Reinstatement | Reinstatement of a safety/security stop is refused without a second reviewer |
| P3-S3 | Budget breaker | At 100% budget, a non-deterministic action that previously ALLOWed now returns the configured restriction (via the cost gate, no contract change); a deterministic action still proceeds |
| P3-S4 | C4 approval | A C4 REQUIRE_APPROVAL routes to a FINANCE authority; an unauthorized approver is refused; on valid approval it links into the decision chain |
| P3-S5 | Timeout fail-closed | Advancing the clock past a C5 item's SLA does not auto-execute it |
| P3-S6 | Anti-rubber-stamp | An approval without confirmed evidence fields is rejected; the approve-without-override metric increments |
| P3-S7 | Health live | With multi-domain activity, the metrics API returns live values; a threshold breach raises its assigned action |
| P3-S8 | Drift (deterministic) | An "Active" claim against a `Tested`-status agent produces a drift finding from the register comparison (no LLM) |
| P3-S9 | Weak-signal cycle | A signal advances through its 30-day and 90-day reviews (via clock); a barren source is deprioritized after three cycles |

---

## Admin console — MVP
**Demo narrative:** "Operate the whole MVP through the screens."

| # | Scenario | Pass criterion |
|---|---|---|
| C-S1 | Login | Authentik login succeeds; the nav/sidebar is scoped to the user's role |
| C-S2 | Register agent | Create an agent (autonomy + allowed tool) and move it through the lifecycle; status shown honestly |
| C-S3 | Simulate decision | The decision simulator returns the full A.R.T.E.F.A.C.T. explanation, obligations, and resolved class |
| C-S4 | Approve C4 | Approve only after confirming evidence; an unauthorized approver cannot (action absent + forced call refused); approval links into the chain |
| C-S5 | Trace | Search and open a trace, following it to decision, explanation, approval, and cost |
| C-S6 | Kill-switch | Apply a permitted stop level with a reason; the simulator then shows the stopped agent's action resolving to DENY |
| C-S7 | Health | The dashboard shows live values; a red/yellow breach surfaces its owner and assigned action |
| C-S8 | Status honesty | No screen labels anything "Active" that the API reports as Tested |
| C-S9 | Hygiene | Role-aware nav verified for ≥2 roles; empty/loading/error states present; no hardcoded data; build + lint clean |

---

## Phase 4 — Wave 2 (agent readiness)
**Demo narrative:** "A promotion is blocked by a failing eval; stale context blocks a recommendation."

| # | Scenario | Pass criterion |
|---|---|---|
| P4-S1 | Promotion blocked | An agent with a failing correctness/safety suite cannot transition Designed → Tested; the reason is recorded |
| P4-S2 | Second reviewer | Tested → Active is refused without a second reviewer |
| P4-S3 | Model-version change | Bumping the model version blocks redeploy/promotion until a regression eval passes |
| P4-S4 | Injection gate | An agent failing prompt-injection cases fails the safety suite |
| P4-S5 | Sampling drift | An injected eval-score regression (via clock) raises an alert; Health eval-pass-rate reflects it |
| P4-S6 | Reinstatement eval | The kill-switch reinstatement path now calls the real regression eval (not a manual link) |
| P4-S7 | Stale context | A context item past its TTL makes the Policy freshness gate return DENY/REQUIRE_APPROVAL — with no frozen-contract change |
| P4-S8 | Shared-memory write | An unverified shared long-term write is refused; promotion requires evidence + owner approval routed through the HITL queue |
| P4-S9 | Provenance | An externally-sourced memory item is marked untrusted and is not treated as authoritative |
| P4-S10 | Health metric | The eval-pass-rate metric (null before) now returns real data |

---

## Phase 5 — Wave 3 (digital twin)
**Demo narrative:** "A DT6 claim is refused without fidelity validation; a dashboard claimed as a simulation twin is caught as drift."

| # | Scenario | Pass criterion |
|---|---|---|
| P5-S1 | Advancement gate | A twin missing any criterion (validation evidence / management approval / operating period) cannot advance; the reason is recorded |
| P5-S2 | Simulation restriction | A DT6 claim/advancement is refused unless every simulation-restriction condition is met |
| P5-S3 | Drift catch | A DT3 twin claimed as DT6 produces a drift finding via the register comparison (no LLM) |
| P5-S4 | Health metric | The twin-fidelity-error metric (null before) now returns real data (error vs tolerance) |
| P5-S5 | Configurable timing | A management-adjusted operating period with documented rationale is accepted; defaults behave as guidelines |
| P5-S6 | Fidelity completeness | A complete fidelity record passes; one missing a required field (e.g. tolerance/ground-truth) fails |

---

## Console extension — Wave 2/3
**Demo narrative:** "The 'what's blocking' views — why a promotion, a memory write, or a twin advancement is gated."

| # | Scenario | Pass criterion |
|---|---|---|
| CE-S1 | Eval run | An authorized user runs a suite and reads results; an unauthorized user cannot trigger a promotion or act as second reviewer |
| CE-S2 | Promotion gate view | Shows a blocked promotion and names exactly what blocks it; a failing-gate agent is not shown as production-ready |
| CE-S3 | Memory state | Items render by tier with freshness + provenance; a stale item is flagged and an untrusted item marked non-authoritative |
| CE-S4 | Memory approval | A shared-memory write approval requires evidence confirmation and is shown routing through the HITL queue; an unauthorized owner cannot approve |
| CE-S5 | Twin levels | Twins render with their DT level; the advancement gate view shows a blocked advancement and names what blocks it |
| CE-S6 | Twin honesty | A twin claimed above its level surfaces with a link to its Drift finding; fidelity error vs tolerance is displayed |
| CE-S7 | Hygiene | New areas appear in the role-aware nav only for permitted roles; empty/loading/error states present; no hardcoded data; build + lint clean |

---

## Using this document

- At the **end of each phase**, run the phase suite + regression, then walk the demo narrative and tick the scenarios. Record results against the sign-off checklist.
- Map each Active claim back to its **Active-gate** in the status tracker and attach the three evidence links — a green suite is necessary but not sufficient for Active.
- Keep scenario IDs stable; if a requirement changes in the SRS, update the matching scenario here so the playbook and the spec never diverge.
