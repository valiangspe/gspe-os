"use client"

import { useTheme } from "next-themes"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { Sun03Icon, Moon02Icon } from "@hugeicons/core-free-icons"

// Dark/light switch in the sidebar footer. Icons/labels swap via CSS (.dark)
// so there's no client-only state and no hydration flash. The `d` hotkey from
// theme-provider still toggles too.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip="Toggle theme"
          aria-label="Toggle dark mode"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <HugeiconsIcon icon={Moon02Icon} strokeWidth={2} className="dark:hidden" />
          <HugeiconsIcon icon={Sun03Icon} strokeWidth={2} className="hidden dark:block" />
          <span className="dark:hidden">Dark mode</span>
          <span className="hidden dark:inline">Light mode</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
