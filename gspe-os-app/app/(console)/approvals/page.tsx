"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"

import { EmptyState } from "@/components/console/empty-state"
import { PageHeader } from "@/components/console/page-header"
import {
  ActionClassBadge,
  AutonomyBadge,
} from "@/components/status-badges"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useAuth } from "@/lib/auth/context"
import { APPROVALS } from "@/lib/mock/operations"
import { EVAL_NOW_ISO } from "@/lib/policy-engine"
import type { ApprovalItem, ApprovalState } from "@/lib/mock/types"
import { cn } from "@/lib/utils"

const NOW = Date.parse(EVAL_NOW_ISO)

function slaState(item: ApprovalItem) {
  const remaining = Date.parse(item.deadline) - NOW
  if (item.state !== "pending") return null
  const overdue = remaining < 0
  const hrs = Math.round(Math.abs(remaining) / 3_600_000)
  return { overdue, label: overdue ? `${hrs}h overdue` : `${hrs}h left` }
}

export default function ApprovalsPage() {
  const { authorities, hasAuthority } = useAuth()
  const [items, setItems] = React.useState<ApprovalItem[]>(APPROVALS)
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [confirmed, setConfirmed] = React.useState<Record<string, boolean>>({})
  const [reason, setReason] = React.useState("")

  // Route by risk class to the signed-in user's authorities (REQ-HQ-2).
  const visible = items.filter((i) => authorities.includes(i.requiredAuthority))
  const open = items.find((i) => i.id === openId) ?? null
  const canActOnOpen = open ? hasAuthority(open.requiredAuthority) : false
  const allEvidenceConfirmed =
    open?.evidenceFields.every((_, idx) => confirmed[`${open.id}:${idx}`]) ?? false

  function reset() {
    setOpenId(null)
    setConfirmed({})
    setReason("")
  }

  function setState(id: string, state: ApprovalState) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, state } : i)))
  }

  function approve() {
    if (!open) return
    setState(open.id, "approved")
    toast.success("Approval recorded", {
      description: `Linked to decision ${open.decisionId} and trace ${open.traceId}.`,
    })
    reset()
  }

  function reject() {
    if (!open) return
    if (!reason.trim()) {
      toast.error("A rejection reason is required")
      return
    }
    setState(open.id, "rejected")
    toast.success("Rejected", { description: "Reason recorded to the decision chain." })
    reset()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approval queue"
        description="Human approvals routed by risk class to your authority. Approve requires confirming the specific evidence fields reviewed — a single click is not allowed (anti-rubber-stamp). C4/C5 are fail-closed and never batched."
      >
        <div className="flex gap-1">
          {authorities.map((a) => (
            <Badge key={a} variant="outline">{a}</Badge>
          ))}
        </div>
      </PageHeader>

      {visible.length === 0 ? (
        <EmptyState
          title="No items for your authority"
          description="Switch role (top right) to a FINANCE / CUSTOMER / SAFETY approver or Director to see routed items."
        />
      ) : (
        <div className="grid gap-3">
          {visible.map((item) => {
            const sla = slaState(item)
            return (
              <Card
                key={item.id}
                className="cursor-pointer transition-colors hover:border-primary/50"
                onClick={() => setOpenId(item.id)}
              >
                <CardContent className="flex flex-wrap items-center gap-3 py-1">
                  <ActionClassBadge value={item.riskClass} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.principalName} · {item.principalType}
                      {item.requestedAutonomy ? <> · requests {item.requestedAutonomy}</> : null}
                    </p>
                  </div>
                  {item.failClosed ? (
                    <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400">
                      Fail-closed
                    </Badge>
                  ) : null}
                  {item.state === "pending" && sla ? (
                    <Badge
                      variant="outline"
                      className={cn(sla.overdue && "bg-red-500/10 text-red-700 dark:text-red-400")}
                    >
                      {sla.label}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{item.state}</Badge>
                  )}
                  <Badge variant="outline">{item.requiredAuthority}</Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Sheet open={!!open} onOpenChange={(o) => !o && reset()}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <ActionClassBadge value={open.riskClass} />
                  {open.failClosed ? (
                    <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400">
                      Fail-closed (C4/C5 — never auto-execute)
                    </Badge>
                  ) : null}
                </SheetTitle>
                <SheetDescription>{open.action}</SheetDescription>
              </SheetHeader>

              <div className="space-y-5 px-4 pb-4">
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Principal:</span> {open.principalName} ({open.principalType})</p>
                  <p className="flex items-center gap-2">
                    <span className="text-muted-foreground">Requested autonomy:</span>
                    {open.requestedAutonomy ? <AutonomyBadge value={open.requestedAutonomy} /> : "—"}
                  </p>
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground">Linked:</span>
                    <Link href="/decisions" className="underline underline-offset-2">decision {open.decisionId}</Link>
                    <Link href="/traces" className="underline underline-offset-2">trace {open.traceId}</Link>
                  </p>
                  {open.backupApprover ? (
                    <p><span className="text-muted-foreground">Backup approver:</span> {open.backupApprover}</p>
                  ) : null}
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm font-medium">Confirm the evidence you reviewed</p>
                  {open.evidenceFields.map((f, idx) => {
                    const key = `${open.id}:${idx}`
                    return (
                      <label key={key} className="flex items-start gap-2 rounded-md border p-2.5 text-sm">
                        <Checkbox
                          className="mt-0.5"
                          checked={!!confirmed[key]}
                          onCheckedChange={(v) =>
                            setConfirmed((c) => ({ ...c, [key]: Boolean(v) }))
                          }
                          disabled={!canActOnOpen || open.state !== "pending"}
                        />
                        <span>
                          <span className="font-medium">{f.label}:</span> {f.value}
                        </span>
                      </label>
                    )
                  })}
                </div>

                {!canActOnOpen ? (
                  <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                    Your role is not authorized to approve {open.requiredAuthority} items. The
                    action is not offered.
                  </p>
                ) : null}

                {canActOnOpen && open.state === "pending" ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Rejection reason (required to reject)</Label>
                    <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this rejected?" />
                  </div>
                ) : null}
              </div>

              {canActOnOpen && open.state === "pending" ? (
                <SheetFooter className="flex-row gap-2">
                  <Button
                    className="flex-1"
                    disabled={!allEvidenceConfirmed}
                    onClick={approve}
                  >
                    {allEvidenceConfirmed ? "Approve" : "Confirm all evidence first"}
                  </Button>
                  <Button variant="outline" onClick={reject}>Reject</Button>
                </SheetFooter>
              ) : null}
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
