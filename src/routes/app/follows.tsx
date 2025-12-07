import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { requireAuth } from '@/lib/auth'
import { useFollowing, useFollowers, getUserId } from '@/services'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { UserPlus, Users } from 'lucide-react'

export const Route = createFileRoute('/app/follows')({
  beforeLoad: requireAuth,
  component: RouteComponent,
})

function RouteComponent() {
  const currentUserId = getUserId()
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>('following')

  const { data: following, isLoading: loadingFollowing } = useFollowing(currentUserId || 0)
  const { data: followers, isLoading: loadingFollowers } = useFollowers(currentUserId || 0)

  const followingCount = following?.length || 0
  const followersCount = followers?.length || 0

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Conexões</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie quem você segue e seus seguidores
            </p>
          </div>
          
          <div className="flex gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">{followingCount}</div>
              <div className="text-sm text-muted-foreground">Seguindo</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div>
              <div className="text-3xl font-bold text-primary">{followersCount}</div>
              <div className="text-sm text-muted-foreground">Seguidores</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'following' | 'followers')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="following" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Seguindo ({followingCount})
            </TabsTrigger>
            <TabsTrigger value="followers" className="gap-2">
              <Users className="h-4 w-4" />
              Seguidores ({followersCount})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Seguindo */}
          <TabsContent value="following" className="space-y-4 mt-6">
            {loadingFollowing ? (
              <>
                <FollowCardSkeleton />
                <FollowCardSkeleton />
                <FollowCardSkeleton />
              </>
            ) : following && following.length > 0 ? (
              following.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{user.name}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Seguindo
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12">
                <div className="text-center text-muted-foreground">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Você ainda não está seguindo ninguém</p>
                  <p className="text-sm mt-1">
                    Faça chamadas e siga pessoas interessantes!
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Seguidores */}
          <TabsContent value="followers" className="space-y-4 mt-6">
            {loadingFollowers ? (
              <>
                <FollowCardSkeleton />
                <FollowCardSkeleton />
                <FollowCardSkeleton />
              </>
            ) : followers && followers.length > 0 ? (
              followers.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{user.name}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm">
                      Ver Perfil
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12">
                <div className="text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Você ainda não tem seguidores</p>
                  <p className="text-sm mt-1">
                    Continue fazendo chamadas para aumentar sua rede!
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

function FollowCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
    </Card>
  )
}
