"use client"

import * as React from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/console/data-table"
import { DetailList } from "@/components/console/detail-list"
import { PageHeader } from "@/components/console/page-header"
import { ActionClassBadge, OutcomeBadge } from "@/components/status-badges"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { DECISIONS, EXPLANATIONS } from "@/lib/mock/operations"
import type { DecisionRecord } from "@/lib/mock/types"

const columns: ColumnDef<DecisionRecord, unknown>[] = [
  { accessorKey: "title", header: "Decision", cell: ({ row }) => <span className="font-medium">{row.original.title}</span> },
  { accessorKey: "resolvedActionClass", header: "Class", cell: ({ row }) => <ActionClassBadge value={row.original.resolvedActionClass} /> },
  { accessorKey: "outcome", header: "Outcome", cell: ({ row }) => <OutcomeBadge outcome={row.original.outcome} /> },
  { accessorKey: "decidedBy", header: "Decided by" },
  { accessorKey: "decisionId", header: "Decision id", cell: ({ row }) => <code className="text-xs">{row.original.decisionId}</code> },
]

export default function DecisionsPage() {
  const [selected, setSelected] = React.useState<DecisionRecord | null>(null)
  const explanation = selected
    ? EXPLANATIONS.find((e) => e.id === selected.explanationLogId)
    : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Decision journal"
        description="Every governed decision: what was decided, by whom, using a value-copy snapshot of context. Linked along the chain traceId → decisionId → explanation → approval → evidence → outcome review."
      />

      <DataTable columns={columns} data={DECISIONS} searchPlaceholder="Search decisions…" onRowClick={setSelected} />

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selected.title}
                  <OutcomeBadge outcome={selected.outcome} />
                </SheetTitle>
                <SheetDescription>decisionId {selected.decisionId}</SheetDescription>
              </SheetHeader>

              <div className="space-y-5 px-4 pb-6">
                <DetailList
                  rows={[
                    { label: "Decided by", value: selected.decidedBy },
                    { label: "Resolved class", value: <ActionClassBadge value={selected.resolvedActionClass} /> },
                    { label: "Decided at", value: new Date(selected.decidedAt).toLocaleString() },
                    {
                      label: "Trace",
                      value: <Link href="/traces" className="underline underline-offset-2">{selected.traceId}</Link>,
                    },
                    ...(selected.approvalId
                      ? [{ label: "Approval", value: <Link href="/approvals" className="underline underline-offset-2">{selected.approvalId}</Link> }]
                      : []),
                  ]}
                />

                <div className="space-y-2">
                  <p className="text-sm font-medium">Context snapshot (value-copy)</p>
                  <ul className="space-y-1 text-sm">
                    {selected.contextSnapshot.map((c) => (
                      <li key={c.key} className="rounded-md border px-3 py-1.5">
                        <span className="text-muted-foreground">{c.key}:</span> {c.value}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Evidence</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.evidenceRefs.map((e) => (
                      <code key={e} className="rounded bg-muted px-2 py-0.5 text-xs">{e}</code>
                    ))}
                  </div>
                </div>

                {explanation ? (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Explanation log</p>
                      <DetailList
                        rows={[
                          { label: "Agent", value: `${explanation.agent} v${explanation.agentVersion}` },
                          { label: "Prompt config", value: explanation.promptConfigVersion },
                          { label: "Tool calls", value: explanation.toolCalls.join(", ") },
                          {
                            label: "Uncertainty",
                            value: explanation.uncertaintyFlags.length
                              ? explanation.uncertaintyFlags.join(", ")
                              : "none",
                          },
                          {
                            label: "Alternatives",
                            value: explanation.alternativesConsidered.length
                              ? explanation.alternativesConsidered.join("; ")
                              : "none",
                          },
                        ]}
                      />
                    </div>
                  </>
                ) : null}

                {selected.outcomeReview ? (
                  <div className="rounded-md bg-muted px-3 py-2 text-sm">
                    <span className="font-medium">Outcome review:</span> {selected.outcomeReview}
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
