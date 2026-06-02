import type {
  ActionClass,
  AuthorityMatrixRow,
  Principal,
  Role,
  RoleId,
} from "./types"

// Identity, RBAC & Authority (Domain 1). Mock data.

export const ROLES: Record<RoleId, Role> = {
  viewer: {
    id: "viewer",
    label: "Viewer",
    department: "Operations",
    authorities: [],
  },
  agent_owner: {
    id: "agent_owner",
    label: "Agent Owner",
    department: "Engineering",
    authorities: [],
  },
  os_program_manager: {
    id: "os_program_manager",
    label: "OS Program Manager",
    department: "OS Program",
    authorities: ["ISO"],
  },
  ai_governance_owner: {
    id: "ai_governance_owner",
    label: "AI Governance Owner",
    department: "Governance",
    authorities: ["AI_GOVERNANCE"],
  },
  isms_owner: {
    id: "isms_owner",
    label: "ISMS Owner",
    department: "Security",
    authorities: ["ISO"],
  },
  finance_approver: {
    id: "finance_approver",
    label: "Finance Approver",
    department: "Finance",
    authorities: ["FINANCE"],
  },
  safety_approver: {
    id: "safety_approver",
    label: "Safety Approver",
    department: "HSE",
    authorities: ["SAFETY"],
  },
  customer_approver: {
    id: "customer_approver",
    label: "Customer Approver",
    department: "Sales",
    authorities: ["CUSTOMER"],
  },
  iso_approver: {
    id: "iso_approver",
    label: "ISO Approver",
    department: "QMS",
    authorities: ["ISO"],
  },
  director: {
    id: "director",
    label: "Director",
    department: "Executive",
    authorities: [
      "FINANCE",
      "SAFETY",
      "CUSTOMER",
      "ISO",
      "AI_GOVERNANCE",
      "DIRECTOR",
    ],
  },
}

export const PRINCIPALS: Principal[] = [
  {
    type: "user",
    id: "u-anita",
    name: "Anita Rahmawati",
    email: "anita@gspe.example",
    department: "Finance",
    roleIds: ["finance_approver"],
  },
  {
    type: "user",
    id: "u-budi",
    name: "Budi Santoso",
    email: "budi@gspe.example",
    department: "OS Program",
    roleIds: ["os_program_manager"],
  },
  {
    type: "user",
    id: "u-citra",
    name: "Citra Lestari",
    email: "citra@gspe.example",
    department: "Governance",
    roleIds: ["ai_governance_owner"],
  },
  {
    type: "user",
    id: "u-dewi",
    name: "Dewi Anggraini",
    email: "dewi@gspe.example",
    department: "Executive",
    roleIds: ["director"],
  },
  {
    type: "user",
    id: "u-eko",
    name: "Eko Prasetyo",
    email: "eko@gspe.example",
    department: "Operations",
    roleIds: ["viewer"],
  },
  {
    type: "user",
    id: "u-fitri",
    name: "Fitri Handayani",
    email: "fitri@gspe.example",
    department: "Engineering",
    roleIds: ["agent_owner"],
  },
]

const CLASSES: ActionClass[] = ["C0", "C1", "C2", "C3", "C4", "C5"]

// Authority matrix (REQ-ID-2). A compact, honest mapping per role.
function row(
  roleId: RoleId,
  resourceType: string,
  verdicts: Partial<Record<ActionClass, AuthorityMatrixRow["byClass"][ActionClass]>>,
  fallback: AuthorityMatrixRow["byClass"][ActionClass] = "forbidden",
): AuthorityMatrixRow {
  const byClass = {} as AuthorityMatrixRow["byClass"]
  for (const c of CLASSES) byClass[c] = verdicts[c] ?? fallback
  return { roleId, resourceType, byClass }
}

export const AUTHORITY_MATRIX: AuthorityMatrixRow[] = [
  row("viewer", "*", { C0: "permitted" }),
  row("agent_owner", "agent", {
    C0: "permitted",
    C1: "permitted",
    C2: "approver-required",
  }),
  row("os_program_manager", "*", {
    C0: "permitted",
    C1: "permitted",
    C2: "approver-required",
    C3: "approver-required",
  }),
  row("finance_approver", "invoice", {
    C0: "permitted",
    C1: "permitted",
    C2: "permitted",
    C4: "permitted",
  }),
  row("safety_approver", "work-permit", {
    C0: "permitted",
    C1: "permitted",
    C5: "permitted",
  }),
  row("customer_approver", "customer-comm", {
    C0: "permitted",
    C1: "permitted",
    C3: "permitted",
  }),
  row("director", "*", {
    C0: "permitted",
    C1: "permitted",
    C2: "permitted",
    C3: "permitted",
    C4: "permitted",
    C5: "approver-required",
  }),
]

export function principalRoles(principal: Principal): Role[] {
  return principal.roleIds.map((id) => ROLES[id])
}
