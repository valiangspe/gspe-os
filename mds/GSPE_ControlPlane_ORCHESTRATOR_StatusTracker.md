# ORCHESTRATOR.md — Build Status Tracker

> Drop this section into `ORCHESTRATOR.md`. It tracks every domain's maturity using the **production-honesty rule (REQ-SC-16)**: a domain is **Active** only with a passing **test** + an **audit-log** entry + at least one **real (non-test) execution**. A phase ends at **Tested**; real-world use makes it **Active**. Update it at the end of every phase and whenever a real execution flips a gate.

---

## How to use

- Mark a stage by replacing `☐` with `☑ YYYY-MM-DD`.
- **Designed** = built and wired per the SRS. **Tested** = the phase's acceptance tests are green. **Active** = the Active-gate (real execution) below is met and recorded in the Evidence log.
- Never mark **Active** from tests alone. Tests give you Tested; only real or controlled-real execution gives you Active.
- Record the three evidence links (test · audit · real-exec) for each Active domain in the Evidence log.
- Suspended/Retired are exceptional states — record them in the Exceptions register, not the main matrix.

## Status lifecycle (REQ-RG-4)
`Proposed → Designed → Tested → Active → Suspended → Retired`

## Frozen contract
- Policy contract (`PolicyDecisionRequest` / `PolicyDecision`, SRS Appendix A): **frozen ☐**  · version `____`  · last change `____` (reason: `____`).

---

## Milestone rollup

| Milestone | Definition | Reached |
|---|---|---|
| Walking skeleton | One action end-to-end through Identity, Registry, Policy, Tracing, Decision (Phase 1) | ☐ ____ |
| Foundation complete | Domains 1–7 Tested (Phase 2) | ☐ ____ |
| **MVP** | Foundation + Domains 8, 9, 10, 13 (Phase 3) | ☐ ____ |
| Agent-ready | Domains 14–15 Active (Phase 4 + real execution) | ☐ ____ |
| All 16 built | Domains 1–16 Tested | ☐ ____ |
| All 16 Active | Domains 1–16 Active | ☐ ____ |
| Console — MVP | Admin console operates Foundation + Wave 1 | ☐ ____ |
| Console — Wave 2/3 | Eval, Memory, Twin areas added | ☐ ____ |

---

## Domain status matrix

### Foundation (Wave 0)
| # | Domain | Phase | Designed | Tested | Active | Active-gate (real execution required) |
|---|---|---|---|---|---|---|
| 1 | Identity, RBAC & Authority | 2 | ☐ | ☐ | ☐ | Real users/agents mapped; authority checks logged; ≥1 real approval routing uses the authority matrix |
| 2 | Registry | 2 | ☐ | ☐ | ☐ | Agents/tools/workflows registered before use; ≥1 real Policy check reads from the registry |
| 3 | Policy & Gating Engine | 1 | ☐ | ☐ | ☐ | ≥1 real system action blocked, approved, or routed by the engine and logged |
| 4 | Tracing & Observability | 1 | ☐ | ☐ | ☐ | Real cross-app actions produce trace IDs linkable to decisions and approvals |
| 5 | Decision Records | 1 | ☐ | ☐ | ☐ | A real critical decision recorded with value-copy context, approver, evidence, and outcome review |
| 6 | Interface Contract Register | 2 | ☐ | ☐ | ☐ | ≥1 real project/app interface reviewed against SLA and recorded with health status |
| 7 | Control Plane SDK | 2 | ☐ | ☐ | ☐ | ≥2 existing GSPE apps use the SDK/API in real workflows |

### Enforcement (Wave 1)
| # | Domain | Phase | Designed | Tested | Active | Active-gate (real execution required) |
|---|---|---|---|---|---|---|
| 8 | Kill-Switch & Escalation | 3 | ☐ | ☐ | ☐ | Stopped a test agent/workflow in a controlled test; ≥1 real stop/reinstatement logged |
| 9 | Budget & Circuit Breaker | 3 | ☐ | ☐ | ☐ | Real AI/API usage metered and attributed; ≥1 budget threshold tested (breaker fired) |
| 10 | HITL Approval Queue | 3 | ☐ | ☐ | ☐ | Real approvals through the queue; ≥1 overdue/backup/escalation case logged |
| 11 | Capability-Claim Drift Detection | 3 | ☐ | ☐ | ☐ | ≥1 real document/proposal scanned against the register; findings reviewed |
| 12 | Weak-Signal Validation | 3 | ☐ | ☐ | ☐ | Signals through ≥1 full 30-day and 90-day review cycle |
| 13 | OS Health Dashboard | 3 | ☐ | ☐ | ☐ | Real data from multiple domains feeds it; a red/yellow indicator triggers its assigned action |

### Agent-readiness (Wave 2)
| # | Domain | Phase | Designed | Tested | Active | Active-gate (real execution required) |
|---|---|---|---|---|---|---|
| 14 | Evaluation Harness & Promotion Gates | 4 | ☐ | ☐ | ☐ | ≥1 agent/tool promotion blocked or approved based on an eval result |
| 15 | Memory & Context Governance | 4 | ☐ | ☐ | ☐ | Stale context blocks/escalates a real recommendation; shared-memory writes logged with provenance |

### Digital-twin (Wave 3)
| # | Domain | Phase | Designed | Tested | Active | Active-gate (real execution required) |
|---|---|---|---|---|---|---|
| 16 | Digital Twin Maturity & Fidelity | 5 | ☐ | ☐ | ☐ | ≥1 twin with a registered DT level, data-quality record, owner, and validation record |

---

## Evidence log (required to mark a domain Active — REQ-SC-16)

For each domain you mark Active, record all three:

| # | Domain | Test (suite/run ref) | Audit (record/trace ref) | Real execution (what happened, when, traceId) |
|---|---|---|---|---|
| _ | __________ | __________ | __________ | __________ |

> Example row when filling in:
> `3 | Policy & Gating Engine | Policy.Tests #142 green | trace 0b1f… decision d-882 | PPC WO-release blocked for stale BOM, 2026-__-__, trace 0b1f…`

---

## Exceptions register (Suspended / Retired)

| # / object | State | Reason | Owner | Date | Reinstatement / retirement ref |
|---|---|---|---|---|---|
| __________ | Suspended/Retired | __________ | ______ | ______ | __________ |

> Note: a **domain** is rarely Suspended; individual **agents/tools** move to Suspended via the kill-switch (Domain 8) and back via the reinstatement workflow (REQ-KS-5). Record those here so the main matrix stays about platform-domain maturity.

---

## Update discipline

- Update this tracker at the **end of each phase** (move domains to Tested) and **whenever a real execution occurs** (move to Active with an Evidence-log row).
- Cross-reference the rationale in `CLAUDE.md` → Decisions; keep the frozen-contract line current if the Policy contract version ever changes.
- The tracker is itself subject to honesty: do not mark a domain Active to look finished — an Active claim with no real-execution evidence is exactly the capability-claim drift the platform exists to prevent.
