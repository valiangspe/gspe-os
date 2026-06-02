"use client"

import * as React from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/console/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DRIFT_FINDINGS } from "@/lib/mock/operations"
import type { DriftFinding } from "@/lib/mock/types"

export default function DriftPage() {
  const [findings, setFindings] = React.useState<DriftFinding[]>(DRIFT_FINDINGS)

  function resolve(id: string) {
    setFindings((prev) => prev.map((f) => (f.id === id ? { ...f, resolved: true } : f)))
    toast.success("Finding marked resolved")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drift findings"
        description="Capability-claim drift: when a document, dashboard, or proposal claims more maturity than the register supports. The authoritative check is a deterministic register comparison — LLM prose scanning is only a helper."
      />

      <div className="grid gap-3">
        {findings.map((f) => (
          <Card key={f.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                {f.claim}
                {f.resolved ? (
                  <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Resolved</Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-500/15 text-red-700 dark:text-red-400">Open</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Evidence gap:</span> {f.evidenceGap}</p>
              <p><span className="text-muted-foreground">Affected:</span> <code className="text-xs">{f.affectedObject}</code> · owner {f.owner}</p>
              <p><span className="text-muted-foreground">Response:</span> {f.responseAction}</p>
              {!f.resolved ? (
                <Button size="sm" variant="outline" onClick={() => resolve(f.id)}>Mark resolved</Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
