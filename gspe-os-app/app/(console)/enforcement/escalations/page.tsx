import { PageHeader } from "@/components/console/page-header"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ESCALATIONS } from "@/lib/mock/operations"

export default function EscalationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Escalations"
        description="Escalation events routed by the protocol: trigger → recommended action → owner. Triggers include forbidden-tool attempts, repeated rejection, budget breach, restricted-data exposure, agent loops, and injection hijacks."
      />

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Status</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Recommended action</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Raised</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ESCALATIONS.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  {e.resolved ? (
                    <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Resolved</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-500/15 text-amber-700 dark:text-amber-400">Open</Badge>
                  )}
                </TableCell>
                <TableCell className="font-medium">{e.trigger}</TableCell>
                <TableCell>{e.agentName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.recommendedAction}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.owner}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(e.raisedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
