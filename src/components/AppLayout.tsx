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
}

export function AppLayout({ children }: AppLayoutProps) {
  const logout = useLogout()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout.mutate()
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900/20 via-background to-blue-900/20">
      {/* Header/Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            {/* Menu Hambúrguer Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <Link to="/app/dashboard" className="flex items-center gap-2">
              <Video className="h-6 w-6 text-purple-500" />
              <span className="text-xl font-bold text-gradient">RandomCall</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/app/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                activeProps={{
                  className: "bg-white/10 text-purple-400",
                }}
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/app/call"
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                activeProps={{
                  className: "bg-white/10 text-purple-400",
                }}
              >
                <Video className="h-4 w-4" />
                <span>Chamada</span>
              </Link>

              <Link
                to="/app/history"
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                activeProps={{
                  className: "bg-white/10 text-purple-400",
                }}
              >
                <History className="h-4 w-4" />
                <span>Histórico</span>
              </Link>

              <Link
                to="/app/follows"
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                activeProps={{
                  className: "bg-white/10 text-purple-400",
                }}
              >
                <Users className="h-4 w-4" />
                <span>Seguindo</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={handleLogout}
              disabled={logout.isPending}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 mb-16 md:mb-0">
        {children}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-background/95 backdrop-blur-xl">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          <Link
            to="/app/dashboard"
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
            activeProps={{
              className: "bg-white/10 text-purple-400",
            }}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">Início</span>
          </Link>

          <Link
            to="/app/call"
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
            activeProps={{
              className: "bg-white/10 text-purple-400",
            }}
          >
            <Video className="h-5 w-5" />
            <span className="text-xs font-medium">Chamada</span>
          </Link>

          <Link
            to="/app/history"
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
            activeProps={{
              className: "bg-white/10 text-purple-400",
            }}
          >
            <History className="h-5 w-5" />
            <span className="text-xs font-medium">Histórico</span>
          </Link>

          <Link
            to="/app/follows"
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
            activeProps={{
              className: "bg-white/10 text-purple-400",
            }}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs font-medium">Seguindo</span>
          </Link>
        </div>
      </nav>

      {/* Mobile Menu Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[350px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-500" />
              <span className="text-gradient">RandomCall</span>
            </SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col gap-2 mt-8">
            <Link
              to="/app/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
              activeProps={{
                className: "bg-white/10 text-purple-400",
              }}
              onClick={closeMobileMenu}
            >
              <Home className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </Link>

            <Link
              to="/app/call"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
              activeProps={{
                className: "bg-white/10 text-purple-400",
              }}
              onClick={closeMobileMenu}
            >
              <Video className="h-5 w-5" />
              <span className="font-medium">Chamada</span>
            </Link>

            <Link
              to="/app/history"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
              activeProps={{
                className: "bg-white/10 text-purple-400",
              }}
              onClick={closeMobileMenu}
            >
              <History className="h-5 w-5" />
              <span className="font-medium">Histórico</span>
            </Link>

            <Link
              to="/app/follows"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
              activeProps={{
                className: "bg-white/10 text-purple-400",
              }}
              onClick={closeMobileMenu}
            >
              <Users className="h-5 w-5" />
              <span className="font-medium">Seguindo</span>
            </Link>

            <div className="border-t border-white/10 my-4" />

            <Button
              variant="ghost"
              className="justify-start gap-3 px-4 py-3 h-auto"
              onClick={() => {
                closeMobileMenu()
                handleLogout()
              }}
              disabled={logout.isPending}
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sair</span>
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
