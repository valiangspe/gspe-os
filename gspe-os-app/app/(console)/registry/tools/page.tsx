"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/console/data-table"
import { DetailList } from "@/components/console/detail-list"
import { PageHeader } from "@/components/console/page-header"
import { ActionClassBadge, ControlStatusBadge } from "@/components/status-badges"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { TOOLS } from "@/lib/mock/registry"
import type { ToolRecord } from "@/lib/mock/types"

const columns: ColumnDef<ToolRecord, unknown>[] = [
  { accessorKey: "name", header: "Tool", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
  { accessorKey: "owner", header: "Owner" },
  { accessorKey: "sideEffectClass", header: "Side-effect", cell: ({ row }) => <ActionClassBadge value={row.original.sideEffectClass} /> },
  { id: "idempotent", header: "Idempotent", cell: ({ row }) => (row.original.idempotent ? "Yes" : "No") },
  { accessorKey: "dataClassification", header: "Data class" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <ControlStatusBadge status={row.original.status} /> },
]

export default function ToolsPage() {
  const [selected, setSelected] = React.useState<ToolRecord | null>(null)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tools"
        description="The tool contract for every registered tool: side-effect class, schemas, reversibility, permission scope, data classification, and failure behaviour (default fail-closed)."
      />

      <DataTable columns={columns} data={TOOLS} searchPlaceholder="Search tools…" onRowClick={setSelected} />

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selected.name}
                  <ControlStatusBadge status={selected.status} />
                </SheetTitle>
                <SheetDescription>Tool contract · v{selected.version}</SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-6">
                <DetailList
                  rows={[
                    { label: "Owner", value: selected.owner },
                    { label: "Side-effect class", value: <ActionClassBadge value={selected.sideEffectClass} /> },
                    { label: "Input schema", value: <code className="text-xs">{selected.inputSchema}</code> },
                    { label: "Output schema", value: <code className="text-xs">{selected.outputSchema}</code> },
                    { label: "Idempotent", value: selected.idempotent ? <Badge variant="outline">Yes</Badge> : <Badge variant="outline">No</Badge> },
                    { label: "Reversibility", value: selected.reversibility },
                    { label: "Permission scope", value: <code className="text-xs">{selected.permissionScope}</code> },
                    { label: "Data classification", value: selected.dataClassification },
                    { label: "Rate limit", value: selected.rateLimit },
                    { label: "Cost class", value: selected.costClass },
                    { label: "Failure behaviour", value: selected.failureBehavior },
                  ]}
                />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
