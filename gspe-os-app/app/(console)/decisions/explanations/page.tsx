import Link from "next/link"

import { PageHeader } from "@/components/console/page-header"
import { CheckStatusBadge } from "@/components/status-badges"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EXPLANATIONS } from "@/lib/mock/operations"

export default function ExplanationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Explanation log"
        description="How each AI/agent recommendation was formed and governed: agent + version, prompt/config version, tool calls, gate results, uncertainty flags, and alternatives considered."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {EXPLANATIONS.map((e) => (
          <Card key={e.id}>
            <CardHeader>
              <CardTitle className="text-base">{e.agent} <span className="text-muted-foreground">v{e.agentVersion}</span></CardTitle>
              <CardDescription>
                {e.id} · prompt {e.promptConfigVersion} ·{" "}
                <Link href="/decisions" className="underline underline-offset-2">decision {e.decisionId}</Link>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Tool calls</p>
                <div className="flex flex-wrap gap-1">
                  {e.toolCalls.map((t) => (
                    <code key={t} className="rounded bg-muted px-1.5 py-0.5 text-xs">{t}</code>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Gate results</p>
                <div className="flex flex-wrap gap-1.5">
                  {e.gateResults.map((g) => (
                    <span key={g.check} className="flex items-center gap-1 text-xs">
                      {g.check} <CheckStatusBadge status={g.status} />
                    </span>
                  ))}
                </div>
              </div>
              {e.uncertaintyFlags.length ? (
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Uncertainty</p>
                  <div className="flex flex-wrap gap-1">
                    {e.uncertaintyFlags.map((f) => (
                      <Badge key={f} variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400">{f}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
