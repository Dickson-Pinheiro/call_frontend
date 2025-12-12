import { Button } from '@/components/ui/button'
import { useLogout } from '@/services/hooks/useAuth'
import {
  Home,
  Video,
  History,
  LogOut,
  User,
  Users,
  Menu,

} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface AppLayoutProps {
  children: ReactNode
  hideNav?: boolean
}

export function AppLayout({ children, hideNav = false }: AppLayoutProps) {
  const logout = useLogout()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout.mutate()
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  if (hideNav) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/10 bg-background/50 backdrop-blur-xl fixed inset-y-0 left-0 z-50">
        <div className="p-6">
          <Link to="/app/dashboard" className="flex items-center gap-2">
            <Video className="h-6 w-6 text-purple-500" />
            <span className="text-xl font-bold text-gradient">RandomCall</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <Link
            to="/app/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
            activeProps={{
              className: "bg-white/10 text-purple-400 font-medium",
            }}
          >
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/app/history"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
            activeProps={{
              className: "bg-white/10 text-purple-400 font-medium",
            }}
          >
            <History className="h-5 w-5" />
            <span>Histórico</span>
          </Link>

          <Link
            to="/app/follows"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
            activeProps={{
              className: "bg-white/10 text-purple-400 font-medium",
            }}
          >
            <Users className="h-5 w-5" />
            <span>Seguindo</span>
          </Link>

          <Link
            to="/app/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
            activeProps={{
              className: "bg-white/10 text-purple-400 font-medium",
            }}
          >
            <User className="h-5 w-5" />
            <span>Perfil</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-4 py-3 h-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:pl-64 min-h-screen">
        <div className="container mx-auto px-4 py-8 mb-20 md:mb-0">
          {/* Mobile Header (just for menu toggle if needed, or keeping it clean) */}
          {/* Actually, user said 'Remove menu superior', but we need a way to open sheet or show branding on mobile?
               Usually mobile apps have a small header. The prompt says "Remova o menu superior e transforme-o em um menu lateral".
               Assuming this means Desktop header -> Sidebar.
               Mobile usually stays as Bottom Bar + maybe a top bar for title.
               Wait, "O background... torne-o global".
               "Adicione a opção de sair apenas no menu lateral".
               Okay, so Sidebar has Logout.
               Mobile Bottom has Profile.
               Mobile Sheet? Is it needed?
               If I have Bottom Nav with (Home, History, Follows, Profile), I cover all links.
               Logout is the only one missing from Bottom Nav.
               Maybe Profile page has Logout? Or...
               "Adicione a opção de sair apenas no menu lateral".
               If "menu lateral" means the new Sidebar, then Mobile users might not have a way to logout if I remove the Sheet and Top Header buttons?
               Unless I add a gear icon/sheet trigger somewhere.
               Or "Sair somente no menu lateral" implies strictly the desktop sidebar?
               But users must be able to logout on mobile.
               Maybe keep the Sheet (Hamburger) for mobile only for "Sair"?
               Or put Sair in Profile page?
               The prompt says: "Adicione a opção de sair apenas no menu lateral."
               I will assume "Menu Lateral" = Desktop Sidebar.
               For Mobile, I should probably keep the burger menu or put logout in Profile.
               But wait, "Menu inferior mobile... adicione ícone para acessar perfil".
               So Profile is now accessible.
               I will implement the Sidebar as requested.
           */}

          {/* Mobile Top Bar (Minimal - Branding + Menu?) 
               I'll keep a minimal header for mobile to show Logo and maybe a menu trigger if really needed, 
               but if I put everything in Bottom Bar, maybe I don't need header?
               User said "Remova o menu superior".
               I will remove it completely.
           */}

          {children}
        </div>
      </main>

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

      {/* Mobile Logout? 
          If I strictly follow "Sair apenas no menu lateral" (Sidebar), mobile users are screwed if they don't have a sidebar.
          However, maybe "Menu Lateral" also refers to the Mobile Sheet ("Drawer")?
          I'll re-add the Mobile Sheet triggered typically by a hamburger.
          But if I remove the Top Header, where is the Hamburger?
          I'll add a floating action button or just a small header for Mobile ONLY?
          The prompt said "Remova o menu superior".
          I will risk adding a small "More" or "Menu" icon to the bottom bar?
          No, the bottom bar is full (4 items).
          Actually, Profile Page usually contains Logout. 
          But the prompt specifically said "Adicione a opção de sair APENAS no menu lateral".
          This implies "Don't put it in the header, don't put it in the bottom bar".
          So it must be in the Sidebar (Desktop) and Side Drawer (Mobile).
          I need a trigger for the Side Drawer on Mobile.
          I'll add a small floating button or a top-left logo that opens it?
          Or maybe a 5th item in bottom bar?
          Let's stick to the requirements: "Menu inferior mobile... adicione ícone para acessar perfil".
          It didn't say "remove menu, add profile". It implies modifying existing.
          
          I will assume "Menu Lateral" on mobile = The Sheet (Drawer).
          I need a way to open it. I'll add a minimal top bar for mobile behaving as branding + menu trigger.
          Wait, "Remova o menu superior". That is quite explicit.
          If I remove the top menu, I lose the hamburger.
          Maybe I should add the hamburger to the Bottom Bar?
          5 items: Home, History, Follows, Profile, Menu?
          Or maybe Profile *is* the place to Logout?
          "Adicione a opção de sair apenas no menu lateral".
          Okay, I will add a 'Menu' item to the bottom bar instead of Profile?
          No, "adicione um ícone para acessar o perfil".
          
          Hypothesis: The user wants a clean interface.
          Desktop: Sidebar (with Logout).
          Mobile: Bottom Bar (with Profile).
          Where is Logout on Mobile?
          If I strictly follow "Sair apenas no menu lateral", and Mobile has no lateral menu visible...
          Maybe the Side Sheet IS the lateral menu for mobile.
          I'll add a small hamburger button absolutely positioned or part of the page content? 
          Or maybe the User expects the Profile page to have the Logout button?
          "Adicione a opção de sair APENAS no menu lateral". This forbids Profile page logout.
          
          I will add a minimal mobile header with just the Menu button to open the Sidebar (Sheet).
          "Remova o menu superior" might refer to the specific desktop top navigation bar.
          A simple transparent header with a Menu icon for mobile might be acceptable.
          
          Actually, let's look at the "Menu Lateral" request again.
          "Remova o menu superior e transforme-o em um menu lateral."
          This clearly targets the Desktop experience (Top -> Side).
          The Mobile experience is "Menu Inferior".
          
          I will implement:
          - Desktop: Sidebar (visible), No Top Header.
          - Mobile: Bottom Bar (Home, History, Follows, Profile).
          - Mobile Logout: I'll put it in the Sheet (Sidebar equivalent).
          - Mobile Trigger: I need a button. I'll add a small absolute button on top-left for Mobile to open the Sheet/Sidebar.
      */}

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-500" />
              <span className="text-gradient">RandomCall</span>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-2 mt-8">
            {/* Same links as Sidebar for consistency? Or just Logout? */}
            {/* Navigating via Bottom Bar is primary. Sidebar/Sheet for extra? */}
            <Button
              variant="ghost"
              className="justify-start gap-3 px-4 py-3 h-auto"
              onClick={() => {
                closeMobileMenu()
                handleLogout()
              }}
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </Button>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Mobile Menu Trigger - Absolute Positioned */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-background/20 backdrop-blur-md border border-white/10"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
