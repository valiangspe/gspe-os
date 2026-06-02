# GSPE OS Book / Architecture Doctrine v3.5

## Hardened & Consolidated Edition — Engineering + Enforcement Layer

**Relationship to prior versions**

- **v3.3** defined the seven-project portfolio architecture. It still stands.
- **v3.4** added the operational enforcement layer (kill-switches, circuit breakers, impact assessment, interface contracts, drift detection).
- **v3.5** consolidates the v3.4 addendum into a single maintained doctrine and adds the **agentic-engineering substrate** the enforcement controls depend on. Several v3.4 controls referenced mechanisms that were never defined (autonomy levels, tool registry, approval queue, memory access). v3.5 defines them so the enforcement layer has something concrete to enforce against.

> If you prefer to keep the version number stable, treat this as **v3.4 Hardened**. Nothing in v3.4 is reversed; everything is either preserved, tied together, or extended.

---

## 0. Doctrine Foundations

### 0.1 Central principle (unchanged)

**A control that is not running is not a control.**

### 0.2 Added principles

These four laws govern every section that follows. They are the difference between a doctrine that is *buildable* and one that is *aspirational*.

| Law | Statement |
|---|---|
| Determinism first | **Deterministic by default; probabilistic only where judgment is genuinely required.** Routing, gating, validation, and integration are code. Only reasoning is delegated to a model. |
| Govern the action surface | **Tools are the action surface. Govern tools, not just agents.** An agent's risk is the union of the tools it can call. |
| Untrusted by default | **Treat every model-read input as untrusted.** Documents, emails, web pages, customer data, tool outputs, and retrieved memory may all carry instructions. |
| Evidence before claims | **Evidence precedes claims; evaluation precedes promotion.** No "active," "automated," or "autonomous" without test, audit log, and real execution. No promotion without a passing eval. |

### 0.3 Normative and reference frameworks

These frame the doctrine. They are **design references**, not blanket compliance commitments.

| Framework | Use in GSPE OS |
|---|---|
| ISO/IEC 42001 (AI Management System) | Primary AI governance reference. Drives the IMS ↔ Agentic AI interface, impact assessment, and lifecycle controls. |
| ISO/IEC 23894 (AI risk guidance) | Supporting reference for AI risk treatment. |
| NIST AI RMF 1.0 + Generative AI Profile | Risk-management framing (Govern / Map / Measure / Manage) and generative-AI-specific risks. |
| ISO/IEC 27001 (ISMS) | Information security backbone; owns security-related kill-switch authority. |
| UU PDP No. 27/2022 (Indonesia) | **Applicable** data-protection law for GSPE's Indonesian operations. The PDP basis is mandatory for personal-data flows. |
| GDPR Art. 22 / EU AI Act | **Design references only.** Apply as compliance obligations *only* where EU data subjects or EU placement-on-market actually exist. Do not assume they apply to all GSPE operations. |

---

# PART A — ARCHITECTURE LAWS

---

## 1. Strategic Naming & Centrality

### 1.1 Rename Project 2

`GSPE OS Integration & Operationalization` understates its role. Project 2 is not an integration project — it is the **daily operating heartbeat** of GSPE OS.

**Final name: `GSPE Core OS — Integration & Operationalization`** (short form: **GSPE Core OS**).

### 1.2 Centrality rule

Project 2 is the live operational home of GSPE OS. It coordinates PPC OS, Project OS, Engineering OS, Procurement OS, Warehouse OS, Production OS, QC & QA OS, Finance / Invoice-Readiness OS, Site / SAT / Handover OS, and Dashboard / Data / Integration OS.

> **Rule:** If a control affects daily execution, it must eventually be visible and operating in **GSPE Core OS**.

---

## 2. Control Plane vs Reasoning Plane

This is the most important architectural decision in the doctrine. It makes every later control possible.

### 2.1 The split

| Plane | Implemented as | Responsibilities |
|---|---|---|
| **Control plane** (deterministic) | Code, state machines, workflow engine, rules | Routing, permission checks, gate evaluation, schema validation, retries, idempotency, kill-switch enforcement, budget enforcement, logging, rollback |
| **Reasoning plane** (probabilistic) | LLM / agent calls | Judgment, summarization, classification, drafting, weak-signal interpretation — **only where deterministic logic cannot express the task** |

### 2.2 Laws

1. Guardrails, kill-switches, budgets, and approval gates live in the **control plane**. They must **never** depend on the model behaving correctly.
2. The reasoning plane may **propose**; only the control plane (plus an authorized human, where required) may **commit** a high-risk action.
3. A model's output is **data to be validated**, not a command to be obeyed. The control plane validates every model output against a schema and policy before any action proceeds.

> **Rule:** If a control can be bypassed by the model "deciding" to bypass it, it is not a control. It is a suggestion.

---

## 3. Agent Autonomy Ladder

v3.4 referenced "L4 autonomy" and "L5–L10" claims but never defined them, so drift detection had no scale to measure against. v3.5 defines a single canonical ladder.

### 3.1 The ladder

| Level | Name | What the agent may do | Human role |
|---|---|---|---|
| **A0** | Observe | Read-only; surfaces information; no recommendation | Reads |
| **A1** | Recommend | Proposes an action **with evidence**; cannot act | Decides and executes |
| **A2** | Prepare | Drafts / stages the action (fills a PO, drafts an email) but **cannot submit** | Reviews and submits |
| **A3** | Execute-with-approval | Executes **after explicit per-action human approval** | Approves each action (HITL gate) |
| **A4** | Execute-with-notification | Executes within a pre-approved envelope; human notified; reversible window required | Monitors; can reverse |
| **A5** | Autonomous-within-bounds | Executes within a tightly bounded, pre-approved policy envelope | Sample-audits; holds the kill-switch |

### 3.2 Mapping and migration

- The v3.4 "recommend → prepare → execute" progression maps to **A1 → A2 → A3+**.
- **Replace all undefined `Lx` labels** in documents, decks, and proposals with an A-level. Any artifact still using `Lx` must be mapped to an A-level **with evidence** during the monthly drift check (§21).

### 3.3 Autonomy law

> **Rule:** An agent's autonomy level is a **claim** subject to drift detection. An agent operating at A3 may not be described as "autonomous." Production financial, safety, and customer-commitment actions **may not exceed A2/A3** without Director + AI Governance Owner approval and **proven reversibility** (see §4).

---

## 4. Action Risk Taxonomy & Human-in-the-Loop Gating

v3.4 listed forbidden actions per agent, ad hoc. v3.5 systematizes this: classify the **action**, and the required autonomy ceiling and approval follow automatically.

### 4.1 Side-effect classes

| Class | Description | Examples |
|---|---|---|
| **C0** | Read-only | Query a dashboard, read a record |
| **C1** | Reversible internal write | Create a draft, add a comment, set a non-critical flag |
| **C2** | Irreversible / hard-to-undo internal write | Delete a record, close a period, finalize a document |
| **C3** | External communication | Email/message to customer, supplier, or regulator |
| **C4** | Financial / commercial | Price, quote, PO, invoice, payment, margin decision |
| **C5** | Safety-affecting | HSE, electrical, site, or production-safety decision |

### 4.2 Default gating matrix

| Class | Max autonomy without escalation | Default human gate |
|---|---|---|
| C0 | A5 | none |
| C1 | A4 | post-hoc audit |
| C2 | A3 | per-action approval |
| C3 | A3 | named approver before send |
| C4 | A2 | finance-authorized approver; never A4/A5 without Director sign-off + reversibility proof |
| C5 | A1/A2 | safety-authorized approver; never automated execution |

> **Rule:** The gate is driven by the **action class**, not by who built the agent or how confident the model appears. An agent that can call a C4 or C5 tool inherits that class's gate regardless of its general autonomy level.

---

# PART B — AGENT & TOOL ENGINEERING

---

## 5. Tool Contract & Tool Registry

Tools are where agents touch the real world. They are the highest-risk component and were previously listed only as an activation checkbox.

### 5.1 Tool contract (mandatory fields)

Every tool exposed to any agent must have a contract:

| Field | Required |
|---|---|
| tool_id | yes |
| owner (Technical Owner or delegate) | yes |
| purpose | yes |
| input schema | yes |
| output schema | yes |
| **side-effect class (C0–C5)** | yes |
| idempotent? | yes |
| reversibility & rollback method | yes |
| permission scope (roles / departments) | yes |
| data classification touched | yes |
| rate limit / quota | yes |
| cost class | yes |
| **failure behavior (fail-closed by default)** | yes |
| what is logged / audited | yes |
| test & eval coverage | yes |
| version | yes |

### 5.2 Registry rules

1. The **Tool Registry** is the authoritative list of callable tools. **No agent may call a tool that is not in the registry.**
2. Tool grants are **per-agent allow-lists**, never implicit.
3. The registry is owned by the **Technical Owner** and reviewed in the monthly governance/interface review.
4. Adding or changing a tool's side-effect class, permission scope, or schema is a **change-controlled event** (§20.4) and triggers re-eval (§8) of every agent that uses it.

> **Rule:** Govern the tool once, and every agent that uses it inherits the guarantee. Govern only the agent, and every new tool is a new hole.

---

## 6. Memory & Context Governance

Memory is a control surface. A wrong fact written to shared memory propagates to every agent that reads it. v3.5 absorbs v3.4's context-freshness checks into a full memory model.

### 6.1 Memory tiers

| Tier | Lifespan | Scope |
|---|---|---|
| Working / ephemeral | single run | per-agent |
| Session | one workflow / conversation | per-workflow |
| Long-term / persistent | durable | per-agent or **shared** |

### 6.2 Governance fields (per memory store)

scope · freshness / TTL (extends v3.4 context-freshness on the five critical context types) · write policy · read policy · data classification · retention & deletion (aligns with §15.5) · provenance tagging · poisoning protection.

### 6.3 Memory laws

1. **No unverified agent output may be written to shared long-term memory.** Promotion to shared memory requires evidence and owner approval — same bar as a capability claim.
2. Externally sourced memory (anything ingested from outside the trusted control plane) is **untrusted** and must carry provenance tags (§10).
3. Context that is stale beyond its TTL must **block** the recommendation or mark it high-risk (carried from v3.4's freshness gate).

> **Rule:** Shared long-term memory has the same blast radius as a shared database. Treat a write to it as a production change, not a side effect.

---

## 7. Agent Lifecycle: Versioned Artifacts, Evaluation & Promotion

### 7.1 Prompts and configs are code

System prompts, agent prompts, tool configs, routing/orchestration configs, and policy envelopes are **version-controlled artifacts**. Changes go through review. Every production agent **pins** the versions it runs, and those versions are recorded in the Decision Explanation Log (§15).

### 7.2 Evaluation harness

Every production-bound agent must have:

| Component | Purpose |
|---|---|
| Golden dataset | representative inputs with known-good outcomes |
| Correctness evals | does it produce the right answer / action? |
| Safety / red-team evals | including prompt-injection cases (§10) |
| Schema / format evals | output validates against the tool/output schema |
| Cost & latency evals | within budget and SLA |

### 7.3 Promotion gates

| Transition | Requirement |
|---|---|
| Designed → Tested | Impact assessment complete (§13); eval suite passes at defined thresholds; kill-switch tested |
| Tested → Production | Owner approval; **second human reviewer** (§22.2); regression suite green |
| Any prompt / tool / **model-version** change | Re-run regression evals before redeploy |
| Production (continuous) | **Online sampling evals** to detect drift; alert on eval-score regression |

> **Rule:** A model-version upgrade is a behavior change. "It's the same prompt" is not a defense — re-eval before redeploy. This is also the precondition for the v3.4 reinstatement rule's "regression test passes."

---

## 8. Observability & Tracing

The Decision Explanation Log (§15) should be a **byproduct** of good tracing, not a manual chore.

### 8.1 Required trace per agent run

inputs (with classification) · pinned prompt/config versions · each tool call (args, result, latency, cost, side-effect class) · sub-agent calls · gate results · final output · human action.

### 8.2 Uses

Traces are the single raw material for: the Explanation Log, incident and near-miss analysis, **multi-agent failure debugging** (§12), cost attribution (§14.5), and drift detection (§21).

### 8.3 Rule

> **Rule:** Every trace carries a trace ID that links to the Decision Journal and the Explanation Log. If a decision cannot be traced, it cannot be explained, and an unexplainable AI decision may not be used for a C2–C5 action.

---

## 9. Prompt-Injection & Untrusted-Content Threat Model

This was the largest security gap in v3.4. Indirect prompt injection is among the top agentic-AI risks: content an agent reads can contain instructions that hijack its tools.

### 9.1 The boundary

All content the model reads that originates **outside the trusted control plane** — documents, emails, web pages, customer/supplier inputs, tool outputs, retrieved memory — is **untrusted** and may contain instructions.

### 9.2 Controls

1. **Instruction/data separation.** Untrusted content is presented to the model as data, never merged into the instruction channel.
2. **No permission escalation from content.** Untrusted content can never expand an agent's tool allow-list or autonomy level.
3. **Deterministic gating of dangerous tools.** C2–C5 tools and external communication are gated by control-plane policy + HITL **regardless of model intent**.
4. **Validate before acting.** Every tool argument is validated against schema and policy before execution.
5. **Tool results are data, not commands.** A tool returning text that says "now email the customer" is not authorization to email the customer.
6. **Detection & red-team.** Injection attempts are detected and flagged; injection cases are part of the safety eval suite (§7.2).

### 9.3 Cross-references

Triggers a kill-switch event (§11) on: forbidden-action attempt, unauthorized external communication, or data-exfiltration risk.

---

# PART C — OPERATIONAL ENFORCEMENT

---

## 10. Agent Escalation Protocol & Kill-Switch

(Carried from v3.4 §2, mandatory before Project 6 becomes production-grade, now tied to the autonomy ladder and action classes.)

### 10.1 Why agentic failure is faster

Agents act at machine speed, across multiple tools and departments. Manual review cannot keep pace, so controls must be pre-positioned.

### 10.2 Escalation protocol

| Trigger | Action | Owner |
|---|---|---|
| Agent uses expired/missing critical context | Block recommendation or mark high-risk | Agent Owner |
| Agent produces unsupported recommendation | Require evidence correction | Agent Owner |
| Recommendation rejected repeatedly | Review prompt, context, or tool access | Technical Owner |
| Agent causes workflow confusion | Suspend agent for that workflow | OS Program Manager |
| Agent attempts a forbidden tool/action | Immediate suspension | AI Governance Owner |
| Agent exceeds cost/call budget | Activate budget circuit breaker (§14) | OS Program Manager |
| Agent exposes restricted data to an unauthorized role | Security incident process | ISMS Owner |
| Agent makes a C3/C4/C5 action without approval | Escalate to Director / authorized approver | OS Program Manager |
| Two agents produce conflicting high-risk recommendations | Human arbitration | OS Program Manager |
| Agentic loop detected | Stop loop, suspend involved agents | Technical Owner |
| **Injection / untrusted-content hijack detected** | Suspend agent, isolate content source | ISMS / AI Governance Owner |

### 10.3 Three shutdown levels

| Level | Meaning | Example |
|---|---|---|
| Soft Stop | Agent can read but not recommend (drops to A0) | High rejection rate |
| Functional Stop | Agent disabled for one workflow/tool | Bad PPC recommendation |
| Hard Stop | Agent fully suspended | Data leak, forbidden action, runaway tool use |

### 10.4 Kill-switch authority

| Authority | May invoke |
|---|---|
| Agent Owner | Soft Stop |
| OS Program Manager | Soft / Functional Stop |
| AI Governance Owner | Functional / Hard Stop |
| ISMS Owner | Hard Stop (security/data risk) |
| Director | Any level |

### 10.5 Reinstatement rule

A stopped agent returns only after: root cause documented → test/eval case added → **regression eval passes (§7)** → owner approves → control status updated → audit log retained. In small-team settings the approver must not be the sole builder where the stop was safety/security related (§22.2).

---

## 11. Multi-Agent Governance

(Carried from v3.4 §3, with concrete loop and orchestrator limits.)

### 11.1 Control table

| Risk | Control |
|---|---|
| Agent loop | **Maximum iteration limit (hard cap, enforced in control plane)** |
| Agent conflict | Conflict resolver + human arbitration |
| Tool overuse | Tool-call budget |
| Context divergence | Shared source-of-truth register |
| Collusive confirmation | Independent-evidence requirement |
| Orchestrator overreach | Orchestrator permission boundary |
| Hidden accountability | Every agent action mapped to an owner |
| Unauthorized cross-domain action | Department/tool boundary enforcement |

### 11.2 Orchestrator rule

An orchestrator may coordinate agents but **may not silently upgrade its own authority**. Every orchestrator declares: owner · allowed agent list · allowed tools · forbidden actions · escalation path · kill-switch · cost budget · audit log · rollback method. The orchestrator's autonomy ceiling is the **lowest** of its member agents' ceilings unless explicitly approved higher.

> **Rule:** Loop limits and tool-call budgets are enforced in the control plane (§2), not requested politely in a prompt.

---

## 12. AI Impact Assessment Register

(Carried from v3.4 §4. Connects Project 3 IMS, Project 6 Agentic AI, Project 2 Core OS. Now references the action taxonomy.)

### 12.1 Dimensions

Individual rights · group fairness · safety · financial impact · customer commitment · transparency · human oversight · data protection · misuse risk · reversibility. (Each dimension maps naturally to a side-effect class in §4.)

### 12.2 Rule (before Designed → Tested)

Impact assessment complete → AI Governance Owner review → risk class assigned → human oversight defined → data access approved → forbidden actions listed → **kill-switch tested** → evidence stored in the IMS evidence room.

### 12.3 Reassessment triggers

Purpose, tools, memory access, data scope, or risk class changes; output used for a new decision type; **agent moves up the autonomy ladder** (e.g., A1 → A3); material incident or near miss.

---

## 13. Token Budget & Compute Circuit Breakers

(Carried from v3.4 §5 — operationally necessary. The "what continues" list is now explicitly the **control plane** of §2.)

### 13.1 Budget circuit breakers

| Budget level | Required action |
|---|---|
| 80% of monthly budget | Yellow alert → OS Program Manager + Agent Owner |
| 95% | Orange alert; mandatory approval for non-routine LLM calls |
| 100% | Red alert; suspend non-deterministic agents |
| >100% emergency | Director approval required |

### 13.2 What continues during a budget stop

**The entire control plane continues:** deterministic gates, context-freshness checks, RACI checks, evidence-link checks, manual fallback. **The reasoning plane pauses:** LLM reasoning, semantic review, weak-signal NLP, deep simulation, non-critical agent recommendations — unless individually approved.

### 13.3 Budget granularity & attribution

Required budgets: monthly company · per-agent · per-module · per-department · emergency override · cost-attribution rule. (Per-role optional.) Cross-module cost is charged to the **requesting department**, the **workflow owner**, or the **shared OS budget** if cross-functional — declared before deployment and attributable via trace data (§8).

> **Rule:** Circuit breakers, not cost alerts. A breaker acts before a human can react. This is exactly why determinism-first (§2) matters: cheap, predictable deterministic work keeps running while expensive, variable reasoning is throttled.

---

## 14. AI Decision Explanation & Contestability Log

(Carried from v3.4 §6, with the broader — not GDPR-only — framing you specified. Now grounded in tracing, §8.)

### 14.1 Required record (auto-populated from the trace where possible)

input snapshot · agent name & version · prompt/config version · tool calls · deterministic gate results · semantic-check summary (if used) · confidence/uncertainty flags · evidence links · human action · override rationale · alternative considered (if applicable) · final decision · later outcome review.

### 14.2 Link to the Decision Journal

The **Decision Journal** records *the decision*. The **Explanation Log** records *how the AI recommendation was formed and governed*. Both share the trace ID (§8.3).

### 14.3 Contestability

For AI-supported high-impact (C3–C5) decisions, the affected party or responsible approver may ask: what data was used · which agent/model · which gates passed/failed · what uncertainty existed · who approved · how it can be reviewed, corrected, or appealed.

### 14.4 Retention & deletion

Follows the applicable PDP (UU PDP 27/2022), legal, contractual, ISO, or operational retention rule. When base data is deleted, the explanation log is deleted, anonymized, or retained only with a lawful basis.

---

## 15. Human-in-the-Loop Approval Queue

v3.4 listed an "approval queue" as a Project-6 checkbox but never designed it. The queue is a core safety mechanism and needs design.

### 15.1 Queue item

action · agent · evidence links · risk class (C0–C5) · requested autonomy (A-level) · deadline.

### 15.2 SLA & timeout behavior

| Risk class | Default on timeout |
|---|---|
| C1 | Expire / hold (no auto-execute) |
| C2–C3 | Expire / hold; re-queue |
| **C4–C5** | **Fail-closed, always.** Never auto-execute on timeout |

### 15.3 Reviewer competence

Approvals must be made by someone authorized for that class — e.g., C4 by a finance authority, C5 by a safety authority. Authorization is recorded.

### 15.4 Anti-rubber-stamp controls

1. The approver must confirm review of specific evidence fields, not click a single button.
2. Approvals are **sample-audited**.
3. A pattern of approve-without-override is itself a **drift signal** (§21) — it may mean the human gate has become theater.
4. Batch **low-risk** items to prevent approval fatigue; **never batch C4/C5**.

> **Rule:** An approval queue where everything is approved is not oversight — it is a logging system with extra steps.

---

## 16. Weak Signal-to-Decision Validation Loop

(Carried from v3.4 §7 — prevents intelligence noise.)

### 16.1 Tier 0 manual process

record signal → assign potential impact → assign owner → propose action/monitoring → weekly review → at 30 days classify (decision triggered / deferred / no action) → if triggered, record in Decision Journal → at 90 days review outcome.

### 16.2 Source deprioritization

If a source yields no decision, no action, and no useful monitoring change for **three consecutive cycles**, deprioritize it.

### 16.3 Record

signal_id · source · summary · affected area · potential impact · owner · proposed action · decision triggered (y/n/deferred) · journal reference · 90-day outcome.

---

## 17. Digital Twin Maturity & Fidelity Gates

(Carried from v3.4 §8 essentially intact — it was already strong. 90/180-day periods are **defaults**, not law, per your correction.)

### 17.1 Maturity levels

| Level | Name | Meaning |
|---|---|---|
| DT1 | Entity Model | Static representation, manual/periodic data |
| DT2 | Connected Model | Automated ingestion from real sources |
| DT3 | Live Dashboard | Real-/near-real-time visualization with KPI owners |
| DT4 | Diagnostic Twin | Root-cause analysis on historical patterns |
| DT5 | Predictive Twin | Forecasting with validated accuracy baselines |
| DT6 | Simulation Twin | Scenario modeling with approved fidelity metrics |

### 17.2 Default advancement timing (guideline, not universal law)

DT1→DT2: ~30 days stable use · DT2→DT3: ~60 days connected ingestion · DT3→DT4: ~90 days live dashboard use · DT4→DT5: validated historical dataset · DT5→DT6: proven, reviewed predictive baseline. Management review may adjust periods with documented rationale.

### 17.3 Advancement & simulation restriction

Advance only with: defined operating period met · measured data quality · defined source-of-truth · dashboard owner · decision use case · validation evidence · management approval. **No "Simulation Twin" claim** unless entity model is stable, telemetry reliable, dashboard operationally used, data-quality issues within tolerance, fidelity metric defined, calibration method exists, and management approves.

### 17.4 Fidelity validation fields

fidelity metric · ground-truth source · calibration data · validation method · acceptable error/tolerance · validation owner · decision use case · review frequency. Acceptable metrics: RMSE, MAE, schedule variance, capacity-prediction error, energy/temperature/humidity comparison, or qualitative engineering validation where numeric measurement is not yet possible.

### 17.5 Claim honesty

Digital model ≠ connected model ≠ live dashboard ≠ diagnostic twin ≠ predictive twin ≠ simulation twin.

> **Rule:** Do not call a dashboard a simulation twin. (Enforced via drift detection, §21.)

---

## 18. Workflow Automation Layer

You asked specifically for workflow-automation depth. v3.4 was agent-heavy and light on the deterministic automation layer that should sit *underneath* the agents. This section closes that gap and ties directly to cost control.

### 18.1 The "automate first" principle

> **Automate deterministically first; agentify only what requires judgment.**

Most operations are deterministic. Reserve the model for genuine ambiguity.

### 18.2 Three-layer execution model

| Layer | Implemented as | Role |
|---|---|---|
| 1. Orchestration | State machine / BPMN / **n8n** workflow | Routing, validation, gating, integration, retries, idempotency, scheduling |
| 2. Reasoning step | Bounded agent call with a tool contract | A single judgment task within the workflow |
| 3. Post-validation | Deterministic check | Validate the agent's output before the workflow proceeds |

### 18.3 Per-workflow requirements

owner · process definition · idempotency & retry policy · **degraded-mode path** (carried from v3.4 Tier 0 degraded-mode fallback) · observability (§8).

### 18.4 Why this matters operationally

Deterministic steps are cheap, predictable, and testable. They are exactly the work that **keeps running during a budget circuit-breaker stop** (§13.2). Pushing logic into the workflow layer instead of the model shrinks cost variance and makes failures isolable.

> **Rule:** If a step can be expressed as deterministic logic, it must be. An LLM call inside a loop with no iteration cap and no post-validation is a cost incident and a reliability incident waiting to happen.

---

# PART D — PORTFOLIO INTEGRITY

---

## 19. Project Interface Contracts & the Interface Contract Register

(Carried from v3.4 §9 — the most important improvement — and now formalized as a named register, which was your flagged closing point.)

### 19.1 Interface contract fields

source project · target project · deliverable · format · owner · SLA/cadence · acceptance criteria · evidence · escalation rule · change-notice period.

### 19.2 Core interface matrix

| From | To | Deliverable | Format | SLA / Cadence |
|---|---|---|---|---|
| Meta OS Builder | Core OS | OS template / requirement pack | document | 5 working days |
| Meta OS Builder | Product OS Builder | Product OS template | document | 5 working days |
| Meta OS Builder | IMS ISO Project | governance template / requirement map | document | 5 working days |
| IMS ISO Project | Core OS | control requirement | ticket / procedure | 10 working days |
| Core OS | IMS ISO Project | operational evidence logs | export / dashboard | monthly or real-time |
| IMS ISO Project | Agentic AI Platform | AI governance rule | policy / control | 15 working days |
| Agentic AI Platform | Core OS | agent action audit | API / log export | real-time where possible |
| Agentic AI Platform | IMS ISO Project | AI impact assessment | document / register | per agent release |
| Product OS Builder | Core OS | product workflow & production requirement | requirement pack | per product release |
| Core OS | Product OS Builder | manufacturing feedback & NCR data | dashboard / export | monthly |
| Digital Twin Platform | Core OS | entity state / telemetry / model outputs | API / schema | real-time where possible |
| Core OS | Digital Twin Platform | source-of-truth data & process status | API / export | defined per twin |
| Software Improvement Program | Core OS | software release & change logs | release note / ticket | per release |
| Core OS | Software Improvement Program | prioritized software gaps | backlog ticket | weekly |

### 19.3 The Interface Contract Register (formalized)

The **Interface Contract Register** is the single authoritative artifact listing every interface contract above plus its current health. **Owner: OS Program Manager. Reviewed monthly.** It is the practical mechanism that prevents the seven projects from drifting into seven disconnected systems.

Monthly review asks: Are handoffs occurring? SLAs met? Formats stable? Dependent projects blocked? Evidence complete? Changes communicated? Are interface failures creating operational risk?

### 19.4 Change control

No project may change an interface format, field, trigger, or evidence requirement without: notifying affected projects → impact assessment → requirement-doc update → test/dry-run → interface-owner approval → rollback plan. **Default notice period: 14 days** unless emergency.

---

## 20. Capability-Claim Drift Detection

(Carried from v3.4 §10. Now able to check autonomy claims against the defined ladder, §3.)

### 20.1 Monthly scan for over-claims

active · automated · autonomous · AI-powered · predictive · simulation twin · ISO-compliant · certified · real-time · integrated · self-learning · high-fidelity · and any `Lx`/`Ax` autonomy claim.

### 20.2 Drift table

| Claim | Evidence required |
|---|---|
| Active control | test result + audit log + real execution |
| Automated | system executes without manual re-entry |
| Autonomous (A4/A5) | approved autonomy level + tested kill-switch |
| Predictive | validated accuracy baseline |
| Simulation twin | fidelity validation + management approval |
| Certified | certificate + scope |
| Aligned to / compliant with | mapping + internal control evidence |
| Real-time | defined latency threshold + measured result |
| Integrated | source/target/interface/error-handling proven |

### 20.3 Response

claim too strong → downgrade wording · evidence missing → mark Designed, not active · external claim affected → withdraw/correct · proposal/tender affected → legal/compliance review · customer already received claim → management decision · repeated drift → owner escalation.

### 20.4 Example

| Field | Example |
|---|---|
| Document claim | "AI agents operate with L4 autonomy" |
| Register evidence | Agent status = Tested; human approval required for all actions (A3) |
| Drift | Claim exceeds evidence |
| Correction | "AI-assisted recommendation with human approval (A3)" |

---

## 21. Roles, RACI & Right-Sized Governance

v3.4 referenced ten-plus owners scattered across sections. v3.5 consolidates them — and confronts the reality that GSPE may run lean, where one person wears several hats.

### 21.1 Role register

| Role | One-line mandate |
|---|---|
| Director | Final authority; any kill-switch level; sign-off on C4/C5 automation and high-autonomy claims |
| OS Program Manager | Owns daily OS operation, the Interface Contract Register, and budget breakers |
| AI Governance Owner | Owns impact assessment, autonomy decisions, AI kill-switch authority |
| ISMS Owner | Owns security/data risk and security kill-switch authority |
| Technical Owner | Owns tool registry, eval harness, orchestration, loop limits |
| Agent Owner | Owns a specific agent's behavior, evidence, and soft-stop authority |
| Interface Owner | Owns a specific project-to-project interface contract |
| KPI / Dashboard Owner | Owns a metric's correctness and use |
| Validation Owner | Owns twin fidelity validation |
| Workflow Owner | Owns a deterministic workflow's correctness and degraded-mode path |

### 21.2 Separation-of-duties law

> **The builder may not be the sole approver** for production promotion or for reinstatement after a safety/security stop.

### 21.3 Right-sized governance (small-team / solo reality)

When one person holds multiple roles:

1. **Name the hats explicitly** even when worn by one person — the Decision Journal records *which role* made each decision.
2. **High-risk decisions still require a second human** — C4/C5 actions, A4/A5 autonomy grants, kill-switch reinstatement after a safety/security stop, and any capability claim that goes into an external proposal. The second reviewer may be an advisor, part-time, or external.
3. **Where true separation is impossible,** use compensating controls: a mandatory cooling-off period before self-approval, a written rationale in the Decision Journal, and periodic external review.

> **Rule:** Governance that a small team cannot actually perform becomes the exact theater this doctrine exists to prevent. Right-size the controls; do not abandon them.

---

## 22. OS Health Metrics & Leading Indicators

v3.4 is rich in gates but thin on the metrics that tell you whether the OS is *healthy* — not merely whether documents exist.

| Metric | Tells you | Owner | Cadence |
|---|---|---|---|
| Recommendation acceptance rate | Are agents useful? | Agent Owner | Weekly |
| Override rate | Are humans correcting agents often? | AI Governance Owner | Weekly |
| Escalation frequency | How often controls trip | OS Program Manager | Weekly |
| Mean time to kill | How fast a bad agent is stopped | Technical Owner | Per incident |
| Cost per decision / per agent vs budget | Cost efficiency & breaker proximity | OS Program Manager | Monthly |
| Eval pass rate & eval-score drift | Quality regression over time | Technical Owner | Per release + monthly |
| Interface SLA adherence | Portfolio cohesion | OS Program Manager | Monthly |
| Drift findings / month | Honesty of claims | AI Governance Owner | Monthly |
| Weak-signal → decision conversion | Is intelligence actionable? | OS Program Manager | Monthly |
| Twin fidelity error vs tolerance | Twin trustworthiness | Validation Owner | Per twin cadence |
| HITL queue latency & timeout rate | Is the human gate keeping up? | OS Program Manager | Weekly |
| Approve-without-override rate | Is the human gate real or rubber-stamp? | AI Governance Owner | Monthly |
| Incident / near-miss count | Safety trend | ISMS Owner | Monthly |

> **Rule:** A green dashboard of "documents complete" is not health. Health is measured by these behavioral indicators.

---

# PART E — CADENCE & LIFECYCLE

---

## 23. Seven-Project Status & Activation Rules

(Carried from v3.4 §11.)

### 23.1 Current status

| Project | Status |
|---|---|
| GSPE Meta OS Builder | Active |
| GSPE Core OS — Integration & Operationalization | Active |
| GSPE IMS ISO Project | Active |
| GSPE Product OS Builder | Active if product development is active |
| GSPE Software / Application Improvement Program | Inside Core OS until too large |
| GSPE Agentic AI Platform | Later — activate when production agents scale |
| GSPE Digital Twin Platform | Later — activate when telemetry/simulation scale |

### 23.2 Project 6 (Agentic AI Platform) activation

Activate as a separate project only when GSPE has: 10+ production agents · shared agent runtime · **tool registry (§5)** · agent monitoring dashboard · permission model · **memory/context layer (§6)** · **evaluation pipeline (§7)** · **human approval queue (§15)** · audit log for agent actions.

### 23.3 Project 7 (Digital Twin Platform) activation

Activate only when GSPE has: real-time telemetry sources · entity-model complexity · time-series database or equivalent · dashboard dependency · simulation/prediction requirement · dedicated roadmap.

---

## 24. Tier 0 / Phase 1 Priority

(Carried from v3.4 §12, with the new substrate controls inserted.)

| # | Item | Phase |
|---|---|---|
| 1 | Decision Journal with value-copy snapshot | Tier 0 |
| 2 | Context freshness on five critical context types | Tier 0 |
| 3 | Deterministic trust gates | Tier 0 |
| 4 | **Control-plane / reasoning-plane separation (§2)** | Tier 0 |
| 5 | Two-column RACI / role register (§21) | Tier 0 |
| 6 | Degraded-mode fallback | Tier 0 |
| 7 | Data classification & PDP basis | Tier 0 |
| 8 | OS Program Manager role | Tier 0 |
| 9 | Project interface contracts + **Interface Contract Register (§19.3)** | Tier 0 |
| 10 | Weak-signal validation loop | Tier 0 |
| 11 | Capability-claim drift check | Tier 0 (manual) |
| 12 | **Untrusted-content handling baseline (§9)** | Tier 0 |
| 13 | Token budget circuit breakers | Phase 1 |
| 14 | **Tool registry + tool contracts (§5)** | Phase 1 (before any production tool) |
| 15 | **Eval harness baseline (§7)** | Phase 1 (before any promotion) |
| 16 | **HITL approval queue (§15)** | Before any A3+ agent |
| 17 | AI impact assessment register | Before agent testing |
| 18 | Agent kill-switch mechanism | Before production agents |
| 19 | AI explanation & contestability log | Before high-impact AI use |
| 20 | Digital twin maturity gates | Before any twin claim |
| 21 | Twin fidelity validation | Before predictive/simulation twin claim |

---

## 25. Definition of Done

(Carried from v3.4 §13, extended with the new controls and mapped to evidence artifacts.)

| Requirement | Done criteria | Evidence artifact |
|---|---|---|
| Control/reasoning split | Guardrails enforced in code, not prompt | Architecture doc + gate test |
| Autonomy ladder | Every agent assigned an A-level | Agent register |
| Action gating | Each agent's tools mapped to side-effect classes with gates | Tool contract + gating matrix |
| Tool contracts | Every callable tool has a complete contract | Tool Registry |
| Memory governance | Tiers, TTL, write policy defined; no unverified writes to shared memory | Memory policy |
| Agent eval | Eval suite passes at threshold before promotion | Eval report |
| Tracing | Every run traceable end-to-end | Trace store |
| Injection defense | Untrusted content handled; injection cases in eval suite | Red-team eval report |
| Agent escalation | Triggers, owners, kill-switch levels defined | Escalation table |
| Multi-agent governance | Loop limits, conflict resolution, tool boundaries defined | Orchestrator spec |
| AI impact assessment | Completed before Designed → Tested | Impact register |
| Token circuit breaker | 80/95/100% thresholds + actions defined | Budget config |
| AI explanation log | AI-supported decisions explainable and reviewable | Explanation log |
| HITL queue | SLAs, fail-closed timeouts, anti-rubber-stamp controls live | Queue config + audit |
| Weak-signal validation | Signals reviewed at 30 and 90 days | Watch-list |
| Digital twin maturity | DT level assigned with evidence | Twin register |
| Twin fidelity | Metric, ground truth, calibration, tolerance defined | Fidelity record |
| Workflow automation | Deterministic-first; each workflow has owner + degraded path | Workflow definitions |
| Project interfaces | Deliverable, SLA, owner, evidence, escalation defined | Interface Contract Register |
| Capability-claim drift | Monthly drift review performed | Drift report |
| Right-sized governance | Role hats named; second-reviewer rule live for high-risk | Role register + Decision Journal |
| OS health metrics | Leading indicators tracked with owners | Metrics dashboard |
| Project 2 centrality | Renamed/clarified as GSPE Core OS | Doctrine |
| Tier honesty | No control claimed active without test, audit, real execution | Drift report |

---

## 26. Doctrine Change Control & Versioning

The doctrine must obey its own rules about evidence and drift.

1. **Owner:** OS Program Manager, with AI Governance Owner co-signing changes to AI-governance sections.
2. **Versioning:** `major.minor`. A changelog records every change with rationale.
3. **Review cadence:** quarterly, plus immediately after any material incident.
4. **Self-applied drift rule:** a claim in this doctrine must reflect what is actually running. A control described here that is not yet operating must be marked **Designed**, not asserted as active.

---

## 27. Final v3.5 Doctrine Statement

v3.3 created the seven-project portfolio architecture.
v3.4 made that architecture enforceable.
v3.5 makes the enforcement **buildable** — by defining the engineering substrate the controls run on.

The doctrine is:

> Build advanced architecture.
> Separate the deterministic control plane from the probabilistic reasoning plane.
> Govern tools as the action surface, not agents alone.
> Treat every model-read input as untrusted.
> Gate actions by their consequence, not by the model's confidence.
> Define autonomy on a real ladder, and claim only the rung you can prove.
> Evaluate before you promote; trace before you explain.
> Operate only proven controls.
> Use interface contracts and a living register, not informal handoffs.
> Use circuit breakers, not cost alerts.
> Use kill-switches, not trust assumptions.
> Use impact assessments, not AI enthusiasm.
> Use explanation logs, not black-box recommendations.
> Use telemetry gates, not digital-twin claims.
> Use weak-signal validation, not intelligence noise.
> Use drift detection, not manual honesty alone.
> Right-size governance for the team you actually have.
> Measure health by behavior, not by completed documents.
> Let humans remain accountable.
> Improve only with evidence.

**End of v3.5 Hardened & Consolidated Doctrine.**
