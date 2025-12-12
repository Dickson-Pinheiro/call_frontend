import { Link, useRouterState } from "@tanstack/react-router"
import {
  Video,
  Home,
  History,
  Users,
  LogOut,
  User,
  AlignLeft
} from "lucide-react"

import { useLogout } from "@/services"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarRail,
  SidebarInset,
  useSidebar,
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
        <header className="flex h-14 items-center border-b border-white/10 px-4 lg:h-[60px] relative shrink-0">
          <div className="hidden md:flex">
            <CustomSidebarTrigger />
          </div>

          {/* Logo Centered */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none md:pointer-events-auto">
            {/* Mobile Trigger Wrapper - Only visible on mobile, positioned left relative to logo? 
                 Actually user said "Center the logo content, separated from the menu icon".
                 On Desktop: Trigger Left, Logo Center.
                 On Mobile: Logo Center? Content?
                 "Em relação ao cabeçalho superior, coloque o conteúdo da logo centralizado, separado do ícone do menu"
             */}
            <div className="flex items-center gap-2">
              <Video className="h-6 w-6 text-purple-500" />
              <span className="font-bold text-lg text-gradient">RandomCall</span>
            </div>
          </div>

          {/* Mobile Menu Trigger (Left aligned in the flow, Logo checks absolute center) */}
          <div className="md:hidden flex items-center z-10">
            <CustomSidebarTrigger />
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 pt-4 pb-24 md:pb-8">
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

function CustomSidebarTrigger() {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="md:hidden" // Only for mobile? No, user wants it for desktop too? "Substitute the icon...". 
    // The default SidebarTrigger was hidden on mobile. 
    // My CustomTrigger is used in both places (hidden md:flex for desktop logic, md:hidden for mobile logic).
    // Actually I want a generic button.
    >
      <AlignLeft className="h-6 w-6" />
    </Button>
  )
}

function AppSidebar({ logout, handleLogout, isActive }: any) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {/* Hidden when collapsed? Or just Icon? 
             User said "Align icons when menu is collapsed".
             The header usually has the Logo. 
             If I center the logo in the top header, maybe I don't need it in the Sidebar?
             "Em relação ao cabeçalho superior..." implies there IS a top header.
             I'll keep the sidebar header simple or empty if the top header handles identity.
             But the Sidebar typically has identity too.
             I'll keep it but ensure it collapses nicely.
         */}
        <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Video className="h-5 w-5 text-purple-500" />
          </div>
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
              className="group-data-[collapsible=icon]:justify-center"
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
              className="group-data-[collapsible=icon]:justify-center"
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
              className="group-data-[collapsible=icon]:justify-center"
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
              className="group-data-[collapsible=icon]:justify-center"
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
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 group-data-[collapsible=icon]:justify-center"
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
