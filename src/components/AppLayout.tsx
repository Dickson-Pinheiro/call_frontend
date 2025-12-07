import { Button } from '@/components/ui/button'
import { useLogout } from '@/services/hooks/useAuth'
import {
  Home,
  Video,
  History,
  LogOut,
  User,
  Users,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const logout = useLogout()

  const handleLogout = () => {
    logout.mutate()
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900/20 via-background to-blue-900/20">
      {/* Header/Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
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
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
