import { Link, useRouterState } from "@tanstack/react-router"
import {
  Video,
  Home,
  History,
  Users,
  LogOut,
  User,
} from "lucide-react"

import { useLogout } from "@/services"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarRail,
  SidebarInset,
} from "@/components/ui/sidebar"

interface AppLayoutProps {
  children: React.ReactNode
  hideNav?: boolean
}

export function AppLayout({ children, hideNav = false }: AppLayoutProps) {
  const logout = useLogout()
  const router = useRouterState() // To check active path

  const handleLogout = () => {
    logout.mutate()
  }

  const isActive = (path: string) => {
    return router.location.pathname.startsWith(path)
  }

  if (hideNav) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar
        logout={logout}
        handleLogout={handleLogout}
        isActive={isActive}
      />

      <SidebarInset>
        {/* Desktop Header for Trigger */}
        <header className="flex h-14 items-center gap-2 border-b border-white/10 px-4 lg:h-[60px]">
          <SidebarTrigger className="hidden md:flex" />
          <div className="flex-1 flex items-center justify-between md:justify-end">
            {/* Mobile Branding / Menu Trigger Wrapper */}
            <div className="md:hidden flex items-center gap-2">
              {/* Mobile Sidebar Trigger */}
              <SidebarTrigger className="" />
              <span className="font-bold text-lg text-gradient">RandomCall</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 pt-0">
          {children}
        </div>

        {/* Bottom Navigation - Mobile Only */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-background/95 backdrop-blur-xl p-2 pb-safe">
          <div className="grid grid-cols-4 gap-1">
            <Link
              to="/app/dashboard"
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground data-[status=active]:text-purple-400"
              activeProps={{
                className: "bg-white/5 text-purple-400",
              }}
            >
              <Home className="h-5 w-5" />
              <span className="text-[10px] font-medium">Início</span>
            </Link>

            <Link
              to="/app/history"
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground"
              activeProps={{
                className: "bg-white/5 text-purple-400",
              }}
            >
              <History className="h-5 w-5" />
              <span className="text-[10px] font-medium">Histórico</span>
            </Link>

            <Link
              to="/app/follows"
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground"
              activeProps={{
                className: "bg-white/5 text-purple-400",
              }}
            >
              <Users className="h-5 w-5" />
              <span className="text-[10px] font-medium">Seguindo</span>
            </Link>

            <Link
              to="/app/profile"
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground"
              activeProps={{
                className: "bg-white/5 text-purple-400",
              }}
            >
              <User className="h-5 w-5" />
              <span className="text-[10px] font-medium">Perfil</span>
            </Link>
          </div>
        </nav>
      </SidebarInset>
    </SidebarProvider>
  )
}

function AppSidebar({ logout, handleLogout, isActive }: any) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <Video className="h-6 w-6 text-purple-500" />
          <span className="text-xl font-bold text-gradient group-data-[collapsible=icon]:hidden">
            RandomCall
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/app/dashboard")}
              tooltip="Dashboard"
            >
              <Link to="/app/dashboard">
                <Home />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/app/history")}
              tooltip="Histórico"
            >
              <Link to="/app/history">
                <History />
                <span>Histórico</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/app/follows")}
              tooltip="Seguindo"
            >
              <Link to="/app/follows">
                <Users />
                <span>Seguindo</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/app/profile")}
              tooltip="Perfil"
            >
              <Link to="/app/profile">
                <User />
                <span>Perfil</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              disabled={logout.isPending}
              tooltip="Sair"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
