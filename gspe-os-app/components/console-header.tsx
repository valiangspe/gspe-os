"use client"

import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth/context"
import { NAV_GROUPS } from "@/lib/auth/nav"
import { PRINCIPALS, ROLES } from "@/lib/mock/identity"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserSwitchIcon } from "@hugeicons/core-free-icons"

function useCrumbs(pathname: string): string[] {
  for (const group of NAV_GROUPS) {
    if (group.url === pathname) return [group.title]
    const sub = group.items?.find((i) => i.url === pathname)
    if (sub) return [group.title, sub.title]
    // Detail/nested pages fall under the closest matching prefix.
    if (group.items?.some((i) => pathname.startsWith(i.url + "/"))) {
      const match = group.items.find((i) => pathname.startsWith(i.url + "/"))!
      return [group.title, match.title, "Detail"]
    }
  }
  if (pathname === "/dashboard") return ["Dashboard"]
  return ["Console"]
}

export function ConsoleHeader() {
  const pathname = usePathname()
  const { principal, setPrincipalId } = useAuth()
  const crumbs = useCrumbs(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((c, i) => (
              <span key={c + i} className="flex items-center gap-1.5">
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {i === crumbs.length - 1 ? (
                    <BreadcrumbPage>{c}</BreadcrumbPage>
                  ) : (
                    <span className="text-muted-foreground">{c}</span>
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Viewing as
          </span>
          <Select value={principal.id} onValueChange={setPrincipalId}>
            <SelectTrigger size="sm" className="w-56" aria-label="Switch role">
              <HugeiconsIcon icon={UserSwitchIcon} strokeWidth={2} className="size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {PRINCIPALS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} · {p.roleIds.map((r) => ROLES[r].label).join(", ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  )
}
