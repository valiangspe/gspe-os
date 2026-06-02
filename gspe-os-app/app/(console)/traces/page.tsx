"use client"

import * as React from "react"
import Link from "next/link"

import { EmptyState } from "@/components/console/empty-state"
import { PageHeader } from "@/components/console/page-header"
import {
  ActionClassBadge,
  CheckStatusBadge,
  OutcomeBadge,
} from "@/components/status-badges"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { TRACES } from "@/lib/mock/operations"
import type { PolicyOutcome, TraceRecord } from "@/lib/mock/types"

export default function TracesPage() {
  const [query, setQuery] = React.useState("")
  const [outcome, setOutcome] = React.useState<PolicyOutcome | "all">("all")
  const [open, setOpen] = React.useState<TraceRecord | null>(null)

  const filtered = TRACES.filter((t) => {
    const matchesQuery =
      !query ||
      [t.traceId, t.principalName, t.sourceApplication, t.workflow]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase())
    const matchesOutcome = outcome === "all" || t.outcome === outcome
    return matchesQuery && matchesOutcome
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trace explorer"
        description="Every action that crosses the control plane carries a traceId. Search by id, principal, application, workflow, or outcome, then follow a trace to its decision, approval, gate results, and cost."
      />

      <div className="flex flex-wrap gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search traces…"
          className="max-w-xs"
        />
        <Select value={outcome} onValueChange={(v) => setOutcome(v as PolicyOutcome | "all")}>
          <SelectTrigger size="default" className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All outcomes</SelectItem>
            <SelectItem value="ALLOW">Allow</SelectItem>
            <SelectItem value="REQUIRE_APPROVAL">Require approval</SelectItem>
            <SelectItem value="DENY">Deny</SelectItem>
            <SelectItem value="DEGRADE">Degrade</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState description="No traces match your filters." />
      ) : (
        <div className="grid gap-3">
          {filtered.map((t) => (
            <Card key={t.traceId} className="cursor-pointer transition-colors hover:border-primary/50" onClick={() => setOpen(t)}>
              <CardContent className="flex flex-wrap items-center gap-3 py-1">
                <code className="text-xs">{t.traceId}</code>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{t.workflow}</p>
                  <p className="text-xs text-muted-foreground">{t.principalName} · {t.sourceApplication}</p>
                </div>
                <ActionClassBadge value={t.resolvedActionClass} />
                <OutcomeBadge outcome={t.outcome} />
                <Badge variant="outline">${t.costUsd.toFixed(2)} · {t.costTokens} tok</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {open.workflow}
                  <OutcomeBadge outcome={open.outcome} />
                </SheetTitle>
                <SheetDescription>traceId {open.traceId}</SheetDescription>
              </SheetHeader>

              <div className="space-y-5 px-4 pb-6">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <span><span className="text-muted-foreground">Principal:</span> {open.principalName}</span>
                  <span><span className="text-muted-foreground">App:</span> {open.sourceApplication}</span>
                  <span><span className="text-muted-foreground">Cost:</span> ${open.costUsd.toFixed(2)} ({open.costTokens} tokens)</span>
                  <Link href="/decisions" className="underline underline-offset-2">decision {open.decisionId}</Link>
                  {open.approvalId ? (
                    <Link href="/approvals" className="underline underline-offset-2">approval {open.approvalId}</Link>
                  ) : null}
                </div>

                <div className="space-y-0">
                  <p className="mb-2 text-sm font-medium">Timeline</p>
                  <ol className="relative space-y-4 border-l pl-4">
                    {open.events.map((ev, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[1.45rem] top-1 size-2.5 rounded-full bg-border ring-4 ring-background" />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground tabular-nums">{ev.at}</span>
                          <span className="text-sm font-medium">{ev.label}</span>
                          {ev.status && ev.status !== "info" ? (
                            <CheckStatusBadge status={ev.status} />
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">{ev.detail}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
