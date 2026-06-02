import { PageHeader } from "@/components/console/page-header"
import { ActionClassBadge } from "@/components/status-badges"
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
import { AUTHORITY_MATRIX, ROLES } from "@/lib/mock/identity"
import type { ActionClass, AuthorityVerdict } from "@/lib/mock/types"
import { cn } from "@/lib/utils"

const CLASSES: ActionClass[] = ["C0", "C1", "C2", "C3", "C4", "C5"]

const VERDICT_STYLE: Record<AuthorityVerdict, string> = {
  permitted: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "approver-required": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  forbidden: "text-muted-foreground",
}

const VERDICT_LABEL: Record<AuthorityVerdict, string> = {
  permitted: "✓",
  "approver-required": "approval",
  forbidden: "—",
}

export default function IdentityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Identity & authority"
        description="A thin authorization layer over Authentik/CTS. Roles, departments, and the authority matrix mapping (role, action class, resource type) → permitted / approver-required / forbidden. Read-only."
      />

      <Card>
        <CardHeader>
          <CardTitle>Roles & approval authorities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.values(ROLES).map((role) => (
              <div key={role.id} className="rounded-lg border p-3">
                <p className="font-medium">{role.label}</p>
                <p className="text-xs text-muted-foreground">{role.department}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {role.authorities.length ? (
                    role.authorities.map((a) => (
                      <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No approval authority</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Authority matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Role</TableHead>
                  <TableHead>Resource</TableHead>
                  {CLASSES.map((c) => (
                    <TableHead key={c} className="text-center"><ActionClassBadge value={c} /></TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {AUTHORITY_MATRIX.map((row) => (
                  <TableRow key={row.roleId + row.resourceType}>
                    <TableCell className="font-medium">{ROLES[row.roleId].label}</TableCell>
                    <TableCell><code className="text-xs">{row.resourceType}</code></TableCell>
                    {CLASSES.map((c) => (
                      <TableCell key={c} className="text-center">
                        <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", VERDICT_STYLE[row.byClass[c]])}>
                          {VERDICT_LABEL[row.byClass[c]]}
                        </span>
                      </TableCell>
                    ))}
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
