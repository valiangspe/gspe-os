import { PageHeader } from "@/components/console/page-header"
import { ActionClassBadge, AutonomyBadge } from "@/components/status-badges"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { GOVERNANCE_MATRIX, MATRIX_VERSION } from "@/lib/mock/registry"

export default function GovernanceMatrixPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Governance matrix"
        description="Action class → maximum permitted autonomy + approval requirement. Stored as versioned, change-controlled data owned by the Registry — not hardcoded in the engine."
      >
        <Badge variant="outline">matrixVersion {MATRIX_VERSION}</Badge>
      </PageHeader>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Action class</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Max autonomy w/o approval</TableHead>
              <TableHead>Default human gate</TableHead>
              <TableHead>Approver authority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {GOVERNANCE_MATRIX.map((row) => (
              <TableRow key={row.actionClass}>
                <TableCell><ActionClassBadge value={row.actionClass} /></TableCell>
                <TableCell>{row.label}</TableCell>
                <TableCell><AutonomyBadge value={row.maxAutonomyWithoutApproval} /></TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.defaultHumanGate}</TableCell>
                <TableCell>
                  {row.approverAuthority ? (
                    <Badge variant="outline">{row.approverAuthority}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        Hard rule: for C4 (financial) and C5 (safety), an agent at autonomy ≥ A3
        is never allowed to execute autonomously — the engine returns DENY.
      </p>
    </div>
  )
}
