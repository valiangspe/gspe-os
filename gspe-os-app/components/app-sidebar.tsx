"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { NavUser } from "@/components/nav-user"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth/context"
import {
  canView,
  DEFERRED_GROUPS,
  NAV_GROUPS,
  type NavGroup,
} from "@/lib/auth/nav"
import { APPROVALS } from "@/lib/mock/operations"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  BalanceScaleIcon,
  CirclePowerIcon,
  CubeIcon,
  DashboardSquare01Icon,
  Database01Icon,
  RoboticIcon,
  SearchList01Icon,
  Shield01Icon,
  ShieldKeyIcon,
  Task01Icon,
} from "@hugeicons/core-free-icons"

const ICONS: Record<string, IconSvgElement> = {
  dashboard: DashboardSquare01Icon,
  registry: Database01Icon,
  policy: ShieldKeyIcon,
  approvals: Task01Icon,
  decisions: SearchList01Icon,
  enforcement: CirclePowerIcon,
  governance: BalanceScaleIcon,
  agents: RoboticIcon,
  twins: CubeIcon,
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { principal, roles, authorities, roleIds } = useAuth()
  const pathname = usePathname()

  const viewCtx = { hasAuthorityCount: authorities.length, roleIds }
  const groups = NAV_GROUPS.filter((g) => canView(g.visibility, viewCtx))

  const pendingForUser = APPROVALS.filter(
    (a) => a.state === "pending" && authorities.includes(a.requiredAuthority),
  ).length

  const badges: Record<string, number> = { "approvals-pending": pendingForUser }

  const user = {
    name: principal.name,
    email: roles.map((r) => r.label).join(", ") || principal.email || "",
    avatar: "",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <HugeiconsIcon icon={Shield01Icon} strokeWidth={2} className="size-5" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">GSPE OS</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Control Plane
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Control plane</SidebarGroupLabel>
          <SidebarMenu>
            {groups.map((group) => (
              <NavEntry
                key={group.title}
                group={group}
                pathname={pathname}
                badge={group.badgeKey ? badges[group.badgeKey] : undefined}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Later waves</SidebarGroupLabel>
          <SidebarMenu>
            {DEFERRED_GROUPS.map((group) => (
              <SidebarMenuItem key={group.title}>
                <SidebarMenuButton
                  tooltip={group.disabledNote}
                  className="opacity-50"
                  aria-disabled
                >
                  <HugeiconsIcon icon={ICONS[group.iconKey]} strokeWidth={2} />
                  <span>{group.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <ThemeToggle />
        <SidebarSeparator />
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function NavEntry({
  group,
  pathname,
  badge,
}: {
  group: NavGroup
  pathname: string
  badge?: number
}) {
  const icon = ICONS[group.iconKey]

  // Single-link group (no sub-items).
  if (!group.items) {
    const active = group.url ? pathname === group.url : false
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip={group.title} isActive={active}>
          <Link href={group.url ?? "#"}>
            <HugeiconsIcon icon={icon} strokeWidth={2} />
            <span>{group.title}</span>
          </Link>
        </SidebarMenuButton>
        {badge ? <SidebarMenuBadge>{badge}</SidebarMenuBadge> : null}
      </SidebarMenuItem>
    )
  }

  const hasActiveChild = group.items.some((i) => pathname === i.url)

  return (
    <Collapsible
      asChild
      defaultOpen={hasActiveChild}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={group.title} isActive={hasActiveChild}>
            <HugeiconsIcon icon={icon} strokeWidth={2} />
            <span>{group.title}</span>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              strokeWidth={2}
              className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {group.items.map((sub) => (
              <SidebarMenuSubItem key={sub.url}>
                <SidebarMenuSubButton asChild isActive={pathname === sub.url}>
                  <Link href={sub.url}>
                    <span>{sub.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}
