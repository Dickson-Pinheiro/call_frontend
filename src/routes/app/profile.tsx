import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from "@/components/AppLayout"
import { requireAuth } from "@/lib/auth"
import { 
  useUserStats, 
  useCompletedCalls, 
  getUserId,
  getUserName,
  getUserEmail
} from "@/services"
import { 
  User, 
  Mail, 
  Phone, 
  Users, 
  UserPlus,
  Calendar,
  Activity,
  TrendingUp
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

export const Route = createFileRoute('/app/profile')({
  beforeLoad: requireAuth,
  component: RouteComponent,
})

function RouteComponent() {
  const currentUserId = getUserId()
  const userName = getUserName() || 'Usuário'
  const userEmail = getUserEmail() || 'email@example.com'
  
  // Buscar estatísticas de follows
  const { data: userStats, isLoading: isLoadingStats } = useUserStats(
    currentUserId ?? 0, 
    currentUserId ?? 0
  )
  
  // Buscar chamadas completadas
  const { data: calls, isLoading: isLoadingCalls } = useCompletedCalls()
  
  const isLoading = isLoadingStats || isLoadingCalls
  
  // Calcular estatísticas de chamadas
  const totalCalls = calls?.length || 0
  const totalDuration = calls?.reduce((sum, call) => sum + (call.durationSeconds || 0), 0) || 0
  const totalMinutes = Math.floor(totalDuration / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  // Calcular média de duração
  const avgDurationSeconds = totalCalls > 0 ? totalDuration / totalCalls : 0
  const avgMinutes = Math.floor(avgDurationSeconds / 60)
  const avgSeconds = Math.floor(avgDurationSeconds % 60)

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header do Perfil */}
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <Avatar className="w-24 h-24 border-4 border-primary/20">
                <AvatarFallback className="text-3xl font-bold bg-linear-to-br from-primary/30 to-primary/10">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Informações do Usuário */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-bold mb-2">{userName}</h1>
                <div className="flex flex-col sm:flex-row items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{userEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>ID: {currentUserId}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total de Chamadas */}
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Chamadas Realizadas
              </CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{totalCalls}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Total de conversas
              </p>
            </CardContent>
          </Card>

          {/* Seguidores */}
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Seguidores
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {userStats?.followersCount || 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Pessoas seguindo você
              </p>
            </CardContent>
          </Card>

          {/* Seguindo */}
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Seguindo
              </CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {userStats?.followingCount || 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Pessoas que você segue
              </p>
            </CardContent>
          </Card>

          {/* Tempo Total */}
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tempo Total
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {hours > 0 ? `${hours}h` : ''} {minutes}min
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Em chamadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas Detalhadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Atividade de Chamadas */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Atividade de Chamadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de chamadas</span>
                {isLoading ? (
                  <Skeleton className="h-5 w-12" />
                ) : (
                  <span className="text-lg font-semibold">{totalCalls}</span>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tempo médio</span>
                {isLoading ? (
                  <Skeleton className="h-5 w-16" />
                ) : (
                  <span className="text-lg font-semibold">
                    {avgMinutes > 0 ? `${avgMinutes}min ` : ''}{avgSeconds}s
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tempo total</span>
                {isLoading ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <span className="text-lg font-semibold">
                    {hours > 0 ? `${hours}h ` : ''}{minutes}min
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rede Social */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Rede Social
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Seguidores</span>
                {isLoading ? (
                  <Skeleton className="h-5 w-12" />
                ) : (
                  <span className="text-lg font-semibold">
                    {userStats?.followersCount || 0}
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Seguindo</span>
                {isLoading ? (
                  <Skeleton className="h-5 w-12" />
                ) : (
                  <span className="text-lg font-semibold">
                    {userStats?.followingCount || 0}
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Razão seguidor/seguindo</span>
                {isLoading ? (
                  <Skeleton className="h-5 w-16" />
                ) : (
                  <span className="text-lg font-semibold">
                    {userStats?.followingCount && userStats.followingCount > 0
                      ? ((userStats.followersCount || 0) / userStats.followingCount).toFixed(1)
                      : '0.0'}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações da Conta */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <p className="text-lg mt-1">{userName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-lg mt-1">{userEmail}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">ID do Usuário</label>
                <p className="text-lg mt-1">{currentUserId}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-lg mt-1">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Online
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
