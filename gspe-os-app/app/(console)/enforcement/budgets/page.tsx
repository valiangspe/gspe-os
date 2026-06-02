import { PageHeader } from "@/components/console/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BREAKER_EVENTS, BUDGETS } from "@/lib/mock/operations"
import type { BudgetThresholdState } from "@/lib/mock/types"
import { cn } from "@/lib/utils"

const STATE_STYLE: Record<BudgetThresholdState, string> = {
  ok: "bg-emerald-500",
  yellow: "bg-amber-500",
  approval: "bg-orange-500",
  suspended: "bg-red-500",
}

const STATE_LABEL: Record<BudgetThresholdState, string> = {
  ok: "OK",
  yellow: "80% — yellow alert",
  approval: "95% — approval required",
  suspended: "100% — suspended",
}

export default function BudgetsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget breakers"
        description="Circuit breakers, not just alerts: 80% → yellow alert; 95% → approval required for non-routine LLM calls; 100% → suspend non-deterministic agents. During a budget stop the control plane keeps running; only the reasoning plane pauses."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {BUDGETS.map((b) => {
          const pct = Math.min(100, Math.round((b.spentUsd / b.limitUsd) * 100))
          return (
            <Card key={b.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  {b.name}
                  <Badge variant="outline" className="capitalize">{b.scope}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="tabular-nums">${b.spentUsd.toLocaleString()} / ${b.limitUsd.toLocaleString()}</span>
                  <span className="text-muted-foreground tabular-nums">{pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", STATE_STYLE[b.state])} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{STATE_LABEL[b.state]}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>Breaker event history</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Threshold</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Action taken</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {BREAKER_EVENTS.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell><Badge variant="outline">{e.threshold}</Badge></TableCell>
                    <TableCell className="font-medium">{e.budgetName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.action}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(e.at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
