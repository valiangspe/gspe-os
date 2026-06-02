import Link from "next/link"

import { HealthDot } from "@/components/status-badges"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { HealthMetric } from "@/lib/mock/types"

// A health metric tile. Per REQ-HM-2 it always shows owner + cadence, and on a
// red/yellow breach surfaces the assigned action and a link to act on it.
export function MetricCard({ metric }: { metric: HealthMetric }) {
  const breached = metric.status === "yellow" || metric.status === "red"
  return (
    <Card className="gap-3">
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <HealthDot status={metric.status} />
          {metric.label}
        </CardDescription>
        <CardTitle
          className={cn(
            "text-2xl font-semibold tabular-nums",
            metric.status === "na" && "text-muted-foreground",
          )}
        >
          {metric.value}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs text-muted-foreground">
        <p>
          Owner: <span className="text-foreground">{metric.owner}</span> · {metric.cadence}
        </p>
        {metric.assignedAction ? (
          <div
            className={cn(
              "rounded-md px-2 py-1.5",
              breached
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                : "bg-muted",
            )}
          >
            <span className="font-medium">Action:</span> {metric.assignedAction}
            {metric.linkArea ? (
              <>
                {" — "}
                <Link href={metric.linkArea} className="underline underline-offset-2">
                  open
                </Link>
              </>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
