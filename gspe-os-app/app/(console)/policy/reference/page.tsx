import { PageHeader } from "@/components/console/page-header"
import { ActionClassBadge, AutonomyBadge } from "@/components/status-badges"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { GOVERNANCE_MATRIX } from "@/lib/mock/registry"
import type { ActionClass, AutonomyLevel } from "@/lib/mock/types"

const CLASS_LADDER: { id: ActionClass; name: string; meaning: string }[] = [
  { id: "C0", name: "Read", meaning: "Read — no side effects" },
  { id: "C1", name: "Reversible write", meaning: "Write that can be undone" },
  { id: "C2", name: "Hard-to-undo write", meaning: "Write that is hard to reverse" },
  { id: "C3", name: "External communication", meaning: "Sends something outside the org" },
  { id: "C4", name: "Financial", meaning: "Moves money / financial commitment" },
  { id: "C5", name: "Safety", meaning: "Safety-critical action" },
]

const AUTONOMY_LADDER: { id: AutonomyLevel; meaning: string }[] = [
  { id: "A0", meaning: "Observe only" },
  { id: "A1", meaning: "Recommend" },
  { id: "A2", meaning: "Prepare" },
  { id: "A3", meaning: "Execute after approval" },
  { id: "A4", meaning: "Execute then notify" },
  { id: "A5", meaning: "Autonomous in bounds" },
]

export default function ReferencePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Gating reference"
        description="The ladders operators need to read decisions: action-class risk (C0–C5), agent autonomy (A0–A5), and the gating matrix that ties them together."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Action classes (C0–C5)</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {CLASS_LADDER.map((c) => (
                <li key={c.id} className="flex items-center gap-3">
                  <ActionClassBadge value={c.id} />
                  <span className="text-sm"><span className="font-medium">{c.name}</span> — {c.meaning}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Autonomy levels (A0–A5)</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {AUTONOMY_LADDER.map((a) => (
                <li key={a.id} className="flex items-center gap-3">
                  <AutonomyBadge value={a.id} />
                  <span className="text-sm">{a.meaning}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Gating matrix</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Class</TableHead>
                  <TableHead>Max autonomy w/o approval</TableHead>
                  <TableHead>Default human gate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {GOVERNANCE_MATRIX.map((g) => (
                  <TableRow key={g.actionClass}>
                    <TableCell><ActionClassBadge value={g.actionClass} /></TableCell>
                    <TableCell><AutonomyBadge value={g.maxAutonomyWithoutApproval} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{g.defaultHumanGate}</TableCell>
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
