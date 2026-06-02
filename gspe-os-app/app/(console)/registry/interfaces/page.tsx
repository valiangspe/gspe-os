import { PageHeader } from "@/components/console/page-header"
import { HealthDot } from "@/components/status-badges"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { INTERFACES } from "@/lib/mock/registry"

export default function InterfacesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Interface contract register"
        description="Project-to-project and app-to-app interfaces with SLA/cadence and health (green/yellow/red). Change control requires notice, impact assessment, dry-run, owner approval, and a rollback plan."
      />

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Health</TableHead>
              <TableHead>Source → Target</TableHead>
              <TableHead>Deliverable</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>SLA / cadence</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Last handoff</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {INTERFACES.map((i) => (
              <TableRow key={i.id}>
                <TableCell><HealthDot status={i.health} /></TableCell>
                <TableCell className="font-medium">{i.source} → {i.target}</TableCell>
                <TableCell>{i.deliverable}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{i.format}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{i.slaCadence}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{i.owner}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(i.lastHandoff).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
