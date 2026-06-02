# SRS Extension — GSPE OS Control Plane Platform

## Wave 2: Agent-Readiness Domains (14–15)

**Status:** Extension to `GSPE_ControlPlane_SRS_Foundation.md` and `GSPE_ControlPlane_SRS_Wave1.md`
**Relationship:** This document adds Part 6 to the SRS. **Part 1 (System Core) is unchanged and still binds.** Domains are numbered to match their domain ID (Domain 14 = §14).

> **What Wave 2 is for.** Foundation governs passively; Wave 1 enforces; **Wave 2 is the gate before production-grade agents**. No agent should reach production autonomy (A3+ in controlled workflows, and certainly nothing higher) until evaluation and memory governance are Active. Wave 2 also activates seams left open earlier:
> - **Registry status lifecycle (REQ-RG-4):** the `Designed → Tested` and `Tested → Active` transitions now have a real gate.
> - **Kill-switch reinstatement (REQ-KS-5):** "regression eval passed" becomes a real eval call instead of a recorded evidence link.
> - **Health (REQ-HM-1):** the eval-pass-rate metric, left null until now, gets real data.
> - **Policy freshness gate (REQ-PE-12) and SDK `CheckContextFreshness` (REQ-SDK-1):** backed by the real Memory & Context service instead of a Foundation stub.

---

## Part 6 — Agent-Readiness Wave Domain Requirements

### 6.0 New ports introduced
`IEvalPort`, `IMemoryPort`. Cross-domain access remains ports-only (REQ-SC-3). Both promote behavior that earlier domains referenced as stubs or evidence links.

### 6.0.1 AI impact assessment (no new domain)
The v3.5 **AI impact assessment** is not a separate backend domain. It is recorded as **required evidence on the `Designed → Tested` promotion gate** (§14) and stored against the Registry agent record. Its dimensions (individual rights, group fairness, safety, financial impact, customer commitment, transparency, human oversight, data protection, misuse risk, reversibility) are captured as a structured assessment attached to the promotion decision.

---

## 14. Domain 14 — Evaluation Harness & Promotion Gates

### 14.1 Purpose
Prevent untested agents, prompts, tools, and model changes from entering production. This domain turns "promotion" from a status flip into an evidence-gated, deterministic transition.

### 14.2 Functional requirements
REQ-EV-1. The harness SHALL maintain **golden datasets** per agent — representative inputs with known-good expected outcomes — versioned alongside the agent.
REQ-EV-2. The harness SHALL provide eval suites: **correctness**, **safety/red-team** (including prompt-injection cases per the threat model), **schema/format validity**, **tool-use correctness** (right tool, allowed tool), **cost/latency**, and **regression**. Each suite SHALL produce a pass/fail against defined thresholds plus a score.
REQ-EV-3. The harness SHALL enforce **promotion gates** wired to the Registry status lifecycle (REQ-RG-4):
- `Designed → Tested` requires: a completed **AI impact assessment** (§6.0.1), an eval-suite pass at defined thresholds, and a **tested kill-switch** (Domain 8).
- `Tested → Active` (production) requires: owner approval, a **second reviewer** (segregation of duties, REQ-ID-4), and a green **regression** suite.
REQ-EV-4. A **prompt, tool, or model-version change** SHALL require a regression eval **before redeploy**. A model-version upgrade SHALL be treated as a behavior change ("same prompt" is not a defense).
REQ-EV-5. Production agents SHALL be subject to **online sampling evals** to detect drift; an eval-score regression SHALL raise an alert, feed the Health eval-pass-rate metric (REQ-HM-1), and MAY trigger Drift (Domain 11) or a Kill-switch escalation (Domain 8).
REQ-EV-6. Eval results SHALL be stored as **append-only evidence**, linked to the Registry agent record and to the promotion decision (Decision domain), and traced.
REQ-EV-7. Promotion SHALL be **gated, not advisory**: when thresholds are not met, the transition SHALL be blocked.
REQ-EV-8. The harness SHALL expose `IEvalPort`: `RunEvalSuite(agentVersion, suite)`, `GetEvalResult(...)`, `CheckPromotionGate(from, to, agentVersion)`, `RecordPromotionDecision(...)`. Once this domain is Active, the kill-switch reinstatement workflow (REQ-KS-5) SHALL call `CheckPromotionGate` / the regression suite instead of accepting a manual regression-evidence link.

### 14.3 Acceptance
Active only when at least one agent or tool promotion is **blocked or approved based on an eval result**.

---

## 15. Domain 15 — Memory & Context Governance

### 15.1 Purpose
Control memory, context freshness, provenance, TTL, and shared-memory writes. Memory is a **control surface**: a wrong fact written to shared memory propagates to every agent that reads it.

### 15.2 Functional requirements
REQ-MG-1. The domain SHALL implement memory **tiers** — working (single run), session (workflow/session), long-term (durable), and **shared** (cross-agent / cross-module) — each with a declared scope, registered in the Registry memory registry (REQ-RG-1).
REQ-MG-2. The domain SHALL enforce **TTL / freshness**: every context or memory item carries `asOf` and a TTL; stale items SHALL be flagged. This service SHALL **back the Policy engine's freshness gate** (REQ-PE-12) and the SDK `CheckContextFreshness` (REQ-SDK-1), promoting any Foundation freshness stub to the real implementation **without changing the frozen contract**.
REQ-MG-3. The domain SHALL enforce **provenance**: every memory item carries a provenance tag (source + trust level). Externally-sourced (untrusted) memory SHALL be marked untrusted (poisoning protection) and SHALL NOT be treated as authoritative.
REQ-MG-4. The domain SHALL enforce **write approval to shared long-term memory**: no unverified agent output SHALL be written to shared long-term memory; promotion to shared memory requires **evidence and owner approval** — the same bar as a capability claim.
REQ-MG-5. The domain SHALL enforce **data classification** on memory: Restricted data in memory SHALL be access-controlled and SHALL respect the data-classification gate (REQ-PE-14).
REQ-MG-6. The domain SHALL enforce **retention/deletion** per UU PDP / ISO / legal (REQ-SC-13); when base data is deleted, derived memory SHALL be deleted, anonymized, or retained only with a recorded lawful basis.
REQ-MG-7. A read of stale context SHALL **block or escalate** a real recommendation (via the freshness gate); every shared-memory write SHALL be logged with provenance and traced.
REQ-MG-8. The domain SHALL expose `IMemoryPort`: `Read(scope, key)`, `Write(scope, key, value, provenance, idempotencyKey)`, `CheckFreshness(contextRef)`, `RequestSharedWriteApproval(...)`. Mutations SHALL require an `idempotencyKey` (REQ-SC-11), and shared-memory writes route their approval through the HITL queue (Domain 10) where owner approval is required.

### 15.3 Acceptance
Active only when stale context **blocks or escalates a real recommendation** and shared-memory writes are logged with provenance.

---

## 16. Updated readiness statement

With Foundation + Wave 1 + Wave 2 Active, the control plane can **safely promote agents to production**: evaluation gates entry, memory governance keeps context fresh and trustworthy, and the kill-switch/budget/approval enforcement already exists to contain them. Only at this point should agents operate above A2 — and A3 only in controlled workflows, with A4/A5 still later and per the governance matrix and the C4/C5 hard rule (REQ-PE-9). Wave 3 (Digital Twin maturity, Domain 16) remains deferred until telemetry and fidelity mature. The production-honesty rule (REQ-SC-16) governs every "Active" claim throughout.

*End of Wave 2 SRS extension.*
