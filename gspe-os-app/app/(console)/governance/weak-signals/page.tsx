import { PageHeader } from "@/components/console/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WEAK_SIGNALS } from "@/lib/mock/operations"
import type { WeakSignalClassification } from "@/lib/mock/types"

const CLASS_STYLE: Record<WeakSignalClassification, string> = {
  decision: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  monitor: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  deferred: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  none: "bg-muted text-muted-foreground",
}

const CLASS_LABEL: Record<WeakSignalClassification, string> = {
  decision: "Decision triggered",
  monitor: "Monitoring rule",
  deferred: "Deferred",
  none: "No action",
}

export default function WeakSignalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Weak-signal watch-list"
        description="Prevent the watch-list from becoming noise. Each signal has an owner, potential impact, a 30-day classification, and a 90-day outcome. Sources that yield nothing for three cycles are deprioritized."
      />

      <div className="grid gap-3">
        {WEAK_SIGNALS.map((s) => (
          <Card key={s.id} className={s.deprioritized ? "opacity-70" : undefined}>
            <CardHeader className="pb-2">
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                {s.summary}
                <Badge variant="outline" className={CLASS_STYLE[s.classification]}>
                  {CLASS_LABEL[s.classification]}
                </Badge>
                {s.deprioritized ? <Badge variant="secondary">Deprioritized</Badge> : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Source:</span> {s.source} · <span className="text-muted-foreground">area</span> {s.affectedArea}</p>
              <p><span className="text-muted-foreground">Potential impact:</span> {s.potentialImpact}</p>
              <p><span className="text-muted-foreground">Proposed action:</span> {s.proposedAction}</p>
              <p><span className="text-muted-foreground">Owner:</span> {s.owner}</p>
              {s.outcome90Day ? (
                <p className="rounded-md bg-muted px-3 py-1.5 text-xs">
                  <span className="font-medium">90-day outcome:</span> {s.outcome90Day}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
