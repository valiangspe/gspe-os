"use client"

import * as React from "react"

import { PageHeader } from "@/components/console/page-header"
import {
  ActionClassBadge,
  CheckStatusBadge,
  OutcomeBadge,
} from "@/components/status-badges"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AGENTS, TOOLS } from "@/lib/mock/registry"
import { PRINCIPALS } from "@/lib/mock/identity"
import { evaluatePolicy } from "@/lib/policy-engine"
import type {
  ActionClass,
  AutonomyLevel,
  DataClassification,
  PolicyDecisionRequest,
} from "@/lib/mock/types"

type ContextMode = "none" | "fresh" | "stale"

interface FormState {
  principalType: "user" | "agent"
  principalId: string
  autonomy: AutonomyLevel
  actionType: string
  declaredClass: ActionClass | "auto"
  resourceType: string
  resourceId: string
  toolId: string
  includeTrace: boolean
  includeEvidence: boolean
  contextMode: ContextMode
  untrusted: boolean
  dataClass: DataClassification | "none"
}

const DEFAULTS: FormState = {
  principalType: "agent",
  principalId: "agent-ppc-planner",
  autonomy: "A2",
  actionType: "release_work_order",
  declaredClass: "auto",
  resourceType: "work-order",
  resourceId: "WO-5521",
  toolId: "tool-wo-release",
  includeTrace: true,
  includeEvidence: true,
  contextMode: "fresh",
  untrusted: false,
  dataClass: "none",
}

const SCENARIOS: { label: string; patch: Partial<FormState> }[] = [
  { label: "WO release (agent A2, C2)", patch: { ...DEFAULTS } },
  {
    label: "Approve payment (agent A3, C4)",
    patch: {
      principalType: "agent",
      principalId: "agent-fin-reconciler",
      autonomy: "A3",
      actionType: "approve_payment",
      declaredClass: "auto",
      resourceType: "invoice",
      resourceId: "INV-20451",
      toolId: "tool-invoice-approve",
      includeEvidence: true,
      contextMode: "fresh",
    },
  },
  {
    label: "Email customer (agent A3, C3)",
    patch: {
      principalType: "agent",
      principalId: "agent-crm-responder",
      autonomy: "A3",
      actionType: "email_customer",
      declaredClass: "auto",
      resourceType: "customer-comm",
      resourceId: "CC-3320",
      toolId: "tool-customer-email",
      includeEvidence: true,
    },
  },
  {
    label: "No traceId",
    patch: { includeTrace: false },
  },
  {
    label: "Stale BOM context (C2)",
    patch: { contextMode: "stale", includeEvidence: true },
  },
  {
    label: "Injection + C3 tool",
    patch: {
      principalId: "agent-crm-responder",
      actionType: "email_customer",
      resourceType: "customer-comm",
      toolId: "tool-customer-email",
      untrusted: true,
      includeEvidence: true,
    },
  },
  {
    label: "Foreign tool (not in allow-list)",
    patch: { toolId: "tool-invoice-approve" },
  },
]

function buildRequest(f: FormState): PolicyDecisionRequest {
  const context =
    f.contextMode === "none"
      ? []
      : [
          {
            key: "bom",
            sourceId: "Engineering",
            asOf: f.contextMode === "fresh" ? "2026-06-02T11:30:00Z" : "2026-06-02T06:00:00Z",
            ttlSeconds: 3600,
          },
        ]
  return {
    traceId: f.includeTrace ? "tr-sim-0001" : "",
    idempotencyKey: "idem-sim-0001",
    principal: {
      type: f.principalType,
      id: f.principalId,
      autonomyLevel: f.principalType === "agent" ? f.autonomy : undefined,
    },
    sourceApplication: "Simulator",
    workflow: "policy-simulation",
    action: {
      type: f.actionType,
      declaredClass: f.declaredClass === "auto" ? undefined : f.declaredClass,
      resource: { type: f.resourceType, id: f.resourceId },
    },
    tool: f.toolId === "none" ? undefined : { id: f.toolId },
    context,
    evidence: f.includeEvidence ? [{ type: "document", ref: "EVD-001" }] : [],
    dataClassification: f.dataClass === "none" ? undefined : f.dataClass,
    untrustedContentPresent: f.untrusted,
  }
}

export default function SimulatorPage() {
  const [form, setForm] = React.useState<FormState>(DEFAULTS)
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }))

  const request = React.useMemo(() => buildRequest(form), [form])
  const decision = React.useMemo(() => evaluatePolicy(request), [request])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Decision simulator"
        description="Build a PolicyDecisionRequest and the deterministic engine evaluates the eight A.R.T.E.F.A.C.T. checks live. Same input always yields the same decision."
      />

      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => (
          <Button
            key={s.label}
            size="sm"
            variant="outline"
            onClick={() => setForm({ ...DEFAULTS, ...s.patch })}
          >
            {s.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Request form ── */}
        <Card>
          <CardHeader>
            <CardTitle>Request</CardTitle>
            <CardDescription>Principal, action, tool, context and gates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Principal type">
                <Select value={form.principalType} onValueChange={(v) => set("principalType", v as "user" | "agent")}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Principal">
                <Select value={form.principalId} onValueChange={(v) => set("principalId", v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(form.principalType === "agent" ? AGENTS : PRINCIPALS).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {form.principalType === "agent" ? (
              <Field label="Autonomy level">
                <Select value={form.autonomy} onValueChange={(v) => set("autonomy", v as AutonomyLevel)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["A0", "A1", "A2", "A3", "A4", "A5"] as AutonomyLevel[]).map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Action type">
                <Input value={form.actionType} onChange={(e) => set("actionType", e.target.value)} />
              </Field>
              <Field label="Declared class">
                <Select value={form.declaredClass} onValueChange={(v) => set("declaredClass", v as FormState["declaredClass"])}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (infer)</SelectItem>
                    {(["C0", "C1", "C2", "C3", "C4", "C5"] as ActionClass[]).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Resource type">
                <Input value={form.resourceType} onChange={(e) => set("resourceType", e.target.value)} />
              </Field>
              <Field label="Resource id">
                <Input value={form.resourceId} onChange={(e) => set("resourceId", e.target.value)} />
              </Field>
            </div>

            <Field label="Tool">
              <Select value={form.toolId} onValueChange={(v) => set("toolId", v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No tool</SelectItem>
                  {TOOLS.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name} ({t.sideEffectClass})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Context freshness">
              <Select value={form.contextMode} onValueChange={(v) => set("contextMode", v as ContextMode)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No context</SelectItem>
                  <SelectItem value="fresh">Fresh BOM (within TTL)</SelectItem>
                  <SelectItem value="stale">Stale BOM (past TTL)</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <div className="space-y-2 pt-1">
              <Toggle checked={form.includeTrace} onChange={(v) => set("includeTrace", v)} label="Include traceId" />
              <Toggle checked={form.includeEvidence} onChange={(v) => set("includeEvidence", v)} label="Attach evidence" />
              <Toggle checked={form.untrusted} onChange={(v) => set("untrusted", v)} label="Untrusted content present (injection)" />
            </div>
          </CardContent>
        </Card>

        {/* ── Decision ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Decision
              <OutcomeBadge outcome={decision.outcome} />
            </CardTitle>
            <CardDescription>
              decisionId {decision.decisionId} · ruleset {decision.policyRulesetVersion} · matrix {decision.matrixVersion}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Resolved class</span>
              <ActionClassBadge value={decision.resolvedActionClass} />
              {decision.requiredApproverAuthority ? (
                <>
                  <span className="text-muted-foreground">· Approver</span>
                  <Badge variant="outline">{decision.requiredApproverAuthority}</Badge>
                </>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium">Obligations</p>
              <div className="flex flex-wrap gap-1.5">
                {decision.obligations.length ? (
                  decision.obligations.map((o) => (
                    <Badge key={o} variant="secondary">{o}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">None</span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium">A.R.T.E.F.A.C.T. checks</p>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Check</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {decision.checks.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          {c.label}
                          <div className="text-xs font-normal text-muted-foreground">{c.rule}</div>
                        </TableCell>
                        <TableCell><CheckStatusBadge status={c.status} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{c.detail}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} />
      {label}
    </label>
  )
}
