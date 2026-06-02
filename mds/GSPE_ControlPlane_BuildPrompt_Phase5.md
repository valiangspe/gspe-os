# Claude Code Build Prompt — GSPE OS Control Plane Platform

## Phase 5: Wave 3 — Digital Twin Maturity & Fidelity

> Run this **after Phases 0–4** (the platform is built and Tested through Wave 2). `GSPE_ControlPlane_SRS_Foundation.md` plus the Wave 1/2/3 extensions, `CLAUDE.md`, `ORCHESTRATOR.md`, and the frozen contract assembly all exist. **Build this only once real telemetry sources and entity models exist**; until then it can be scaffolded with seeded/test twins to reach Tested, but Active requires a real twin. This is the last domain.

---

## Role and mission

You are the senior .NET engineer completing the **GSPE OS Control Plane Platform**. The platform now governs, enforces, and is agent-ready. Your mission is the final domain — **Digital Twin Maturity & Fidelity** — whose job is to keep twin maturity **honest**: model reality, gate every advancement on evidence, and stop a dashboard from being sold as a simulation. Build Domain 16 per the SRS and wire it into the two seams left open for it.

---

## Source of truth and reading order

1. Re-read `CLAUDE.md` and `ORCHESTRATOR.md`.
2. Authoritative SRS sections:
   - Foundation Part 1 (System Core, all laws bind), §4.2 Registry, §4.3 Policy + Appendix A (**frozen contract — do not change it**).
   - Wave 1 §11 (Drift, REQ-DD-2 — the register comparison the twin claim plugs into), §13 (Health, REQ-HM-1 — the twin-fidelity-error metric).
   - `GSPE_ControlPlane_SRS_Wave3.md` Part 7 — §16 Digital Twin Maturity & Fidelity, including the DT1–DT6 ladder, advancement gate, simulation restriction, and fidelity validation record.
3. SRS wins over this prompt on conflict. Fill silence with the smallest reasonable decision and log it in `CLAUDE.md` → Decisions.

---

## Guardrails (unchanged — they still bind)

Modular monolith, vertical slices, **ports-only** access. Policy engine core **pure**, contract **frozen**. **Deterministic + fail-closed** for C2–C5. **No-trace → DENY.** **Idempotency** on every mutation. **No local auth.** **Append-only** records. Governance matrix is **versioned data**. The **C4/C5 hard rule** (REQ-PE-9) stays separately tested. The **injectable clock** (`IClock`, from Phase 3) is reused for advancement operating-period timing. No Redis/Kafka/Temporal unless the SRS forces it (REQ-SC-9).

---

## Preconditions to verify

- The Phase 4 agent-readiness suite is green (the ten Phase-4 scenarios).
- The Health twin-fidelity-error metric is currently **null**; the Drift register comparison does **not yet** check twin maturity claims. This phase fills both.
If a precondition fails, fix it first and note it in `CLAUDE.md`.

---

## Phase 5 tasks

### 5.1 Domain 16 — Digital Twin Maturity & Fidelity (SRS §16)
- Implement the **twin registry**: entity, owner, current DT level (DT1–DT6), decision use case. (REQ-DT-1)
- Implement the **telemetry source register**: data source, ingestion method, measured data quality, source-of-truth. (REQ-DT-2)
- Implement the **advancement gate** as a deterministic transition that blocks unless all criteria are met: defined operating period, measured data quality, defined SoT, dashboard owner, decision use case, validation evidence, and **management approval**. (REQ-DT-3)
- Treat the default advancement **timings as configurable guidelines, not law** (DT1→DT2 ≈30d, DT2→DT3 ≈60d, DT3→DT4 ≈90d, DT4→DT5 validated historical dataset, DT5→DT6 proven reviewed baseline); a management-adjusted period with documented rationale is honored. Use `IClock` for the period checks. (REQ-DT-4)
- Enforce the **simulation restriction**: no DT6 (Simulation Twin) claim/advancement unless the entity model is stable, telemetry reliable, the dashboard used operationally, data-quality within approved tolerance, a fidelity metric defined, a calibration method exists, and management approves. (REQ-DT-5)
- Implement the **fidelity validation record**: fidelity metric, ground-truth source, calibration data, validation method, acceptable error/tolerance, validation owner, decision use case, review frequency. Support RMSE, MAE, schedule variance, capacity-prediction error, energy/temperature/humidity comparison, and **qualitative engineering validation** where numeric measurement isn't yet possible. (REQ-DT-6)
- Make the **registered DT level the authoritative claim**; a twin SHALL NOT be described above its registered level. (REQ-DT-7)
- All advancement decisions and fidelity validations append-only, traced, linked to evidence + management approval. (REQ-DT-9)
- Expose `ITwinPort`: `RegisterTwin`, `RecordTelemetrySource`, `CheckAdvancementGate`, `RecordFidelityValidation`, `GetTwinLevel`. (REQ-DT-10)

### 5.2 Integration wiring (the seams Wave 3 promotes — do these explicitly)
1. **Twin → Health:** the twin-fidelity-error metric (REQ-HM-1), null until now, reads real data from `ITwinPort` fidelity validation records (measured error vs tolerance).
2. **Twin → Drift:** the Drift register comparison (Domain 11, REQ-DD-2) now verifies a twin maturity **claim** against the registered DT level and fidelity records — so a dashboard (DT3) claimed as a simulation twin (DT6) produces a deterministic drift finding.

---

## Deferred (do not build now)
- **Real-world Active steps:** registering and validating an actual production twin against real telemetry. (Tested can be reached with seeded/test twins.)
- The **Twin area of the admin console** — a console-extension, not this backend phase.

---

## Phase 5 Definition of Done (acceptance — these must fire for real in tests)

The suite MUST include, all green:
1. **Advancement gate blocks.** A twin missing any criterion (e.g. no validation evidence, or no management approval, or operating period not met) cannot advance; the transition is refused and the reason recorded.
2. **Simulation restriction holds.** A DT6 (Simulation Twin) claim/advancement is refused unless every simulation-restriction condition is satisfied (REQ-DT-5).
3. **Dashboard-as-simulation caught as drift.** A twin registered at DT3 but claimed as DT6 produces a drift finding via the Domain 11 register comparison — no LLM required.
4. **Health twin-fidelity-error populated.** The metric null in Phase 4 now returns real data from fidelity validation records (error vs tolerance).
5. **Configurable timing honored.** A management-adjusted operating period with documented rationale is accepted; the default timings behave as guidelines, not hard law.
6. **Fidelity record completeness.** A twin with a complete fidelity record passes validation; one missing a required field (e.g. tolerance or ground-truth source) fails.

Then update `CLAUDE.md` Decisions; in `ORCHESTRATOR.md`, mark Domain 16 **Tested**, record that **all 16 domains are now built**, and note the remaining real-execution step to mark it **Active** (a real twin with a registered level, data-quality record, owner, and validation record) per REQ-SC-16.

---

## Working style
- Small, reviewable commits: twin registry + telemetry register first, then the advancement gate and simulation restriction, then fidelity validation, then the two wiring steps; tests after each.
- Keep the Policy engine and its frozen contract untouched — Wave 3 plugs into Drift and Health, which already exist.
- End the session with: a Tested-vs-Active status table for all **16** domains, the test run output (highlighting the six Phase-5 scenarios), and the commands to run the twin-maturity demo locally.
