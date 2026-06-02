# SRS System Core — Technology Variant: Next.js / Drizzle (TypeScript)

> **Drop-in replacement for §2.3 of `GSPE_ControlPlane_SRS_Foundation.md`.** Choose this *or* the .NET baseline, not both. Every functional requirement (`REQ-ID/RG/PE/TR/DR/IF/SDK/KS/BC/HQ/DD/WS/HM/EV/MG/DT`) is **unchanged**, and the architecture laws (§2.1, §2.2) and cross-cutting requirements (§2.4) are **unchanged in intent** — this document only maps them to the TypeScript idiom. The control plane is still a deterministic governance backend; this variant suits it well because the contract-and-schema discipline maps onto Zod/Drizzle, but it buys little "AI-native" advantage over the baseline since the agents are governed by the plane, not hosted in it.

---

## §2.3′ Technology decisions (Next.js / Drizzle)

| Layer | Decision |
|---|---|
| Runtime / framework | **Next.js (App Router)** on Node 20+, **TypeScript (strict)** |
| Monorepo | **pnpm** workspace |
| API | Next.js **Route Handlers** (`app/api/...`) are the control-plane API; **one OpenAPI 3 document generated from Zod** (e.g. `zod-to-openapi`), Swagger UI; clients generated from it |
| ORM / data | **Drizzle ORM + PostgreSQL**; **one Postgres schema per domain**; `jsonb` for snapshots, schemas, and explanations; `drizzle-kit` migrations |
| Schema / validation / types | **Zod is the single source of truth** for contracts; **drizzle-zod** derives Zod from Drizzle tables; types via `z.infer` — no codegen step, one source feeds validation, types, and OpenAPI |
| Frozen contract | `PolicyDecisionRequest` / `PolicyDecision` as **Zod schemas in `packages/contracts`**; the OpenAPI doc and every SDK type derive from these |
| SDK | **TypeScript-first** SDK package (native, dogfooded); other-language clients (C#, Java, PHP, Python) **generated from the OpenAPI doc**; documented REST fallback |
| Frontend (admin console) | **React via Next.js + shadcn/ui** (`pnpm dlx shadcn@latest add`) + Tailwind; **Zustand** (+ `useImmer`) for client state, **TanStack Query** for server state — *or* keep a separate Vue 3/PrimeVue console against the same OpenAPI client (see "Frontend implication" below) |
| Auth | **Authentik OIDC** for users (cookie session) + **CTS** for M2M (Bearer); JWT validation via **`jose`** against Authentik's JWKS; no local auth |
| Orchestration | n8n first; Temporal only if complexity demands and can be operated |
| Telemetry | **OpenTelemetry JS**; Postgres trace store for Foundation; Prometheus/Grafana later |
| Cache / queue | Redis when needed (not in the walking skeleton) |
| Secrets | Infisical or environment-injected |
| Tests | **Vitest** (the Policy engine has the highest coverage requirement); **Playwright** for console e2e |

REQ-SC-9 is unchanged: run within a modest host (1 vCPU / 2 GB) for Foundation; introduce Redis/Kafka/Temporal/Kubernetes/OpenSearch only when volume, reliability, or operability genuinely require it. A single Next.js Node server is sufficient.

---

## How the architecture laws map to this stack (unchanged in intent)

| Law (SRS) | TypeScript realization |
|---|---|
| Modular monolith, one deployable (REQ-SC-1) | One Next.js app, deployed as one unit |
| Vertical slice per domain (REQ-SC-2) | `src/domains/<domain>/` each with `schema.ts` (Drizzle), `port.ts` (the published interface), handlers, and tests; shared `packages/contracts`, `packages/db`, `packages/sdk` |
| One schema per domain (REQ-SC-2) | Each domain's Drizzle tables live in a dedicated Postgres schema (`identity`, `registry`, `policy`, …) |
| Ports-only cross-domain access (REQ-SC-3) | A domain imports another domain's `port.ts` **only** — never its `schema.ts`/tables. **Enforce with an ESLint boundary rule** (e.g. `eslint-plugin-boundaries`) so a cross-domain table import fails lint, not just review |
| Future extraction (REQ-SC-4) | A `port.ts` interface can be re-backed by a network client; callers don't change |
| Existing apps via SDK only (REQ-SC-5) | Unchanged — the 14+ apps call the TS SDK or REST |
| Determinism + fail-closed (REQ-SC-6/7/8, REQ-PE-2/16) | The Policy engine is a **pure TS module** `domains/policy/engine.ts` — no DB, no `fetch`, no I/O; the route handler / boundary does persistence and trace. Fail-closed is explicit in the pure function |
| Frozen contract (REQ-PE frozen) | Zod schemas in `packages/contracts`; `z.infer` types; OpenAPI generated from them. Changing them is a version bump + logged note |
| traceId everywhere (REQ-SC-10) | Middleware injects/propagates `traceId`; **`AsyncLocalStorage`** carries trace context through the request |
| Idempotency (REQ-SC-11) | An idempotency-key middleware + a small store; mutating route handlers require the key |
| Append-only records (REQ-SC-12) | Insert-only Drizzle patterns on audit tables (decisions, traces, approvals, kill events); no `update`/`delete` on them |
| Auth delegation (REQ-SC-14) | `jose` validates Authentik/CTS tokens; the app does authorization only |
| Structured errors (REQ-SC-15) | Problem-details JSON, correlated by `traceId`, never leaking restricted data |

---

## Frontend implication (the one real downstream change)

The .NET baseline pairs with a Vue 3 / PrimeVue console. If you adopt this backend, the **cohesive choice is a React / Next.js / shadcn console** in the same monorepo (the API and UI can even share one Next.js app and the contracts package). That means the **AdminConsole and ConsoleExtension build prompts would need a React/shadcn variant** — same screens, same doctrine principles (role-aware, status-honest, anti-rubber-stamp), different component kit (shadcn + TanStack Query + Zustand instead of PrimeVue + Pinia).

Alternatively, because the API is stack-neutral and exposes a generated TS client, you can **keep the existing Vue 3 / PrimeVue console** as a separate app pointed at the same OpenAPI client. That preserves the console prompts you already have, at the cost of running two frontend ecosystems. For a single-ecosystem build, go React; to reuse the prompts as written, keep Vue.

---

## What changes vs the .NET baseline (delta at a glance)

| Concern | .NET baseline | Next.js / Drizzle variant |
|---|---|---|
| Backend | .NET 8, Vertical Slice Architecture | Next.js App Router, domain modules |
| Request handling | MediatR-style handlers + minimal APIs | Route handlers + service functions |
| ORM | EF Core | Drizzle |
| Contract / types | C# DTOs; OpenAPI from attributes | Zod schemas; OpenAPI from Zod (`zod-to-openapi`); `drizzle-zod` |
| Boundary enforcement | project references + review | ESLint boundaries rule (cross-table import fails lint) |
| SDK | .NET first, others generated | TS first, others generated |
| Frontend | Vue 3 / PrimeVue + Pinia | React / shadcn + Zustand + TanStack Query (or keep Vue) |
| Tests | xUnit + FluentAssertions | Vitest (+ Playwright for console) |
| Auth | Authentik/CTS via .NET middleware | Authentik/CTS via `jose` |
| Everything else (laws, FRs, domains, waves, honesty rule) | — | **identical** |

---

## Build-prompt implication

The build prompts (Phase 0–5, console) say "use the stack in §2.3." With this variant in force, the **.NET-specific scaffold steps in Phase 0–1** (solution layout, EF Core, xUnit) map to the TypeScript layout above: a pnpm monorepo, the `domains/<domain>` slice structure, Zod-based frozen contract in `packages/contracts`, Drizzle schemas, Vitest. The phase **goals, acceptance scenarios, and the frozen-contract discipline are unchanged** — only the scaffolding idiom differs. If you commit to this stack, the cleanest next step is a **Next.js variant of the Phase 0–1 bootstrap prompt** (and a React variant of the console prompts); I can produce those on request.

*End of Next.js / Drizzle technology variant.*
