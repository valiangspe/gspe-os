"use client"

import * as React from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/console/page-header"
import { StopLevelBadge } from "@/components/status-badges"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useAuth } from "@/lib/auth/context"
import { STOP_STATES } from "@/lib/mock/operations"
import type { AgentStopState, RoleId, StopLevel } from "@/lib/mock/types"

// Stop authority per REQ-KS-2.
const LEVELS_BY_ROLE: Record<RoleId, StopLevel[]> = {
  agent_owner: ["soft"],
  os_program_manager: ["soft", "functional"],
  ai_governance_owner: ["functional", "hard"],
  isms_owner: ["hard"],
  director: ["soft", "functional", "hard"],
  viewer: [],
  finance_approver: [],
  safety_approver: [],
  customer_approver: [],
  iso_approver: [],
}

const LEVEL_LABEL: Record<StopLevel, string> = {
  none: "Resume",
  soft: "Soft stop",
  functional: "Functional stop",
  hard: "Hard stop",
}

export default function KillSwitchPage() {
  const { roleIds } = useAuth()
  const [states, setStates] = React.useState<AgentStopState[]>(STOP_STATES)
  const [target, setTarget] = React.useState<{ agent: AgentStopState; level: StopLevel } | null>(null)
  const [reason, setReason] = React.useState("")

  const allowed = Array.from(
    new Set(roleIds.flatMap((r) => LEVELS_BY_ROLE[r])),
  )

  function apply() {
    if (!target) return
    if (!reason.trim()) {
      toast.error("A reason is required to apply a stop")
      return
    }
    setStates((prev) =>
      prev.map((s) =>
        s.agentId === target.agent.agentId
          ? {
              ...s,
              stopLevel: target.level,
              reason,
              scope: target.level === "hard" ? "Fully suspended" : "Reduced scope",
            }
          : s,
      ),
    )
    toast.success(`${LEVEL_LABEL[target.level]} applied`, {
      description: `${target.agent.agentName} — traced and append-only. Policy will now DENY actions outside the reduced scope.`,
    })
    setTarget(null)
    setReason("")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kill-switch"
        description="Soft / Functional / Hard stop as a state machine. You may only apply the levels your authority permits (Agent Owner → Soft; OS PM → Soft/Functional; AI Governance → Functional/Hard; ISMS → Hard; Director → any). A stopped agent's actions resolve to DENY."
      >
        <div className="flex gap-1">
          {allowed.length ? allowed.map((l) => (
            <Badge key={l} variant="outline">{LEVEL_LABEL[l]}</Badge>
          )) : <Badge variant="outline">Read-only</Badge>}
        </div>
      </PageHeader>

      <div className="grid gap-3">
        {states.map((s) => (
          <Card key={s.agentId}>
            <CardHeader className="pb-2">
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                {s.agentName}
                <StopLevelBadge level={s.stopLevel} />
                <span className="text-xs font-normal text-muted-foreground">owner: {s.owner}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {s.reason ? (
                <p className="text-sm text-muted-foreground">
                  {s.scope} — {s.reason}
                  {s.appliedBy ? <> (by {s.appliedBy})</> : null}
                </p>
              ) : null}

              {s.reinstatement ? (
                <div className="rounded-md bg-muted px-3 py-2 text-sm">
                  <p className="font-medium">Reinstatement</p>
                  <p className="text-muted-foreground">{s.reinstatement.stage}</p>
                  {s.reinstatement.secondReviewerRequired ? (
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                      Second reviewer required (segregation of duties) ·
                      {s.reinstatement.secondReviewer ? ` ${s.reinstatement.secondReviewer}` : " unassigned"}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {(["soft", "functional", "hard"] as StopLevel[]).map((level) => (
                  <Button
                    key={level}
                    size="sm"
                    variant="outline"
                    disabled={!allowed.includes(level) || s.stopLevel === level}
                    onClick={() => setTarget({ agent: s, level })}
                  >
                    {LEVEL_LABEL[level]}
                  </Button>
                ))}
                {s.stopLevel !== "none" && allowed.length ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setTarget({ agent: s, level: "none" })}
                  >
                    Resume
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={!!target} onOpenChange={(o) => { if (!o) { setTarget(null); setReason("") } }}>
        <SheetContent className="w-full sm:max-w-md">
          {target ? (
            <>
              <SheetHeader>
                <SheetTitle>{LEVEL_LABEL[target.level]} — {target.agent.agentName}</SheetTitle>
                <SheetDescription>
                  {target.level === "none"
                    ? "Resuming requires the reinstatement workflow; for safety/security stops a second reviewer is mandatory."
                    : "This is append-only and traced. Capture the incident reason."}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-1.5 px-4">
                <Label className="text-xs text-muted-foreground">Reason</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Incident / trigger…" />
              </div>
              <SheetFooter>
                <Button onClick={apply}>Confirm {LEVEL_LABEL[target.level].toLowerCase()}</Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
