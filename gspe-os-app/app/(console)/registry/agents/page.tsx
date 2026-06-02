"use client"

import * as React from "react"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/console/data-table"
import { DetailList } from "@/components/console/detail-list"
import { PageHeader } from "@/components/console/page-header"
import {
  ActionClassBadge,
  AutonomyBadge,
  ControlStatusBadge,
} from "@/components/status-badges"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useAuth } from "@/lib/auth/context"
import { AGENTS, toolById } from "@/lib/mock/registry"
import type { AgentRecord, ControlStatus } from "@/lib/mock/types"
import { cn } from "@/lib/utils"

const LIFECYCLE: ControlStatus[] = [
  "Proposed",
  "Designed",
  "Tested",
  "Active",
  "Suspended",
  "Retired",
]

const columns: ColumnDef<AgentRecord, unknown>[] = [
  { accessorKey: "name", header: "Agent", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
  { accessorKey: "owner", header: "Owner" },
  { accessorKey: "autonomy", header: "Autonomy", cell: ({ row }) => <AutonomyBadge value={row.original.autonomy} /> },
  { id: "tools", header: "Allowed tools", cell: ({ row }) => row.original.allowedTools.length },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <ControlStatusBadge status={row.original.status} /> },
  { accessorKey: "version", header: "Version" },
]

export default function AgentsPage() {
  const { hasRole } = useAuth()
  const [selected, setSelected] = React.useState<AgentRecord | null>(null)
  const canTransition = hasRole("agent_owner", "os_program_manager", "director")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents"
        description="Registered agents with their purpose, owner, autonomy level (A0–A5), allowed tools, and honest control status. No agent may act before registration."
      />

      <DataTable
        columns={columns}
        data={AGENTS}
        searchPlaceholder="Search agents…"
        onRowClick={setSelected}
      />

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selected.name}
                  <ControlStatusBadge status={selected.status} />
                </SheetTitle>
                <SheetDescription>{selected.purpose}</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 px-4 pb-6">
                <DetailList
                  rows={[
                    { label: "Owner", value: selected.owner },
                    { label: "Autonomy", value: <AutonomyBadge value={selected.autonomy} /> },
                    { label: "Version", value: selected.version },
                    ...(selected.reducedScope
                      ? [{ label: "Reduced scope", value: selected.reducedScope }]
                      : []),
                  ]}
                />

                <div className="space-y-2">
                  <p className="text-sm font-medium">Allowed tools</p>
                  <ul className="space-y-1.5">
                    {selected.allowedTools.map((id) => {
                      const t = toolById(id)
                      return (
                        <li key={id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                          <span>{t?.name ?? id}</span>
                          {t ? <ActionClassBadge value={t.sideEffectClass} /> : null}
                        </li>
                      )
                    })}
                  </ul>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-sm font-medium">Status lifecycle</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {LIFECYCLE.map((s) => (
                      <span
                        key={s}
                        className={cn(
                          "rounded-md border px-2 py-1 text-xs",
                          s === selected.status
                            ? "border-primary bg-primary/10 font-medium text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  {canTransition ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          toast.info(
                            "Transition is change-controlled (mock)",
                            { description: "Promotion to Active requires real-execution evidence (REQ-SC-16)." },
                          )
                        }
                      >
                        Request transition
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Your role cannot change control status.
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
