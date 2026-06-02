import { AppSidebar } from "@/components/app-sidebar"
import { ConsoleHeader } from "@/components/console-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/lib/auth/context"

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <ConsoleHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
            {children}
          </main>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </AuthProvider>
  )
}
