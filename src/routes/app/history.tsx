import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { requireAuth } from "@/lib/auth";
import { useCompletedCalls } from "@/services";
import { Spinner } from "@/components/ui/spinner";
import { 
  Video, 
  ArrowLeft, 
  Star,
  Calendar,
  Clock,
  Filter,
  AlertCircle,
} from "lucide-react";
import { useMemo } from "react";
import type { Call } from "@/services";

export const Route = createFileRoute('/app/history')({
  beforeLoad: requireAuth,
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const { data: calls, isLoading, error } = useCompletedCalls();

  // Função auxiliar para formatar duração em segundos para MM:SS
  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Função para formatar data relativa
  const formatRelativeDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hoje";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    }
  };

  // Função para obter hora da chamada
  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Função para obter o nome do outro participante
  const getOtherParticipantName = (call: Call, currentUserId: number): string => {
    // TODO: pegar o ID do usuário atual do contexto de autenticação
    // Por enquanto, vamos usar user2Name como padrão
    return call.user1Id === currentUserId ? call.user2Name : call.user1Name;
  };

  // Agrupar chamadas por data
  const groupedCalls = useMemo(() => {
    if (!calls) return {};
    
    return calls.reduce((acc, call) => {
      const dateLabel = formatRelativeDate(call.startedAt);
      if (!acc[dateLabel]) acc[dateLabel] = [];
      acc[dateLabel].push(call);
      return acc;
    }, {} as Record<string, Call[]>);
  }, [calls]);

  // TODO: Implementar avaliação de chamadas quando a API de ratings estiver pronta
  const handleRate = (id: number, rating: number) => {
    console.log(`Rating call ${id} with ${rating} stars`);
    // Aqui será implementado useCreateRating
  };

  // Estados de loading e erro
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Spinner className="w-8 h-8 mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando histórico...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erro ao carregar histórico</h2>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!calls || calls.length === 0) {
    return (
      <AppLayout>
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-background via-background to-primary/5" />
          
          <div className="max-w-4xl mx-auto relative z-10">
            <header className="flex items-center gap-4 mb-8">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate({ to: "/app/dashboard" })}
                className="shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">Histórico de chamadas</h1>
                <p className="text-muted-foreground">Suas conversas anteriores</p>
              </div>
            </header>

            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <Video className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Nenhuma chamada realizada</h2>
              <p className="text-muted-foreground mb-6">
                Você ainda não participou de nenhuma chamada.<br />
                Comece agora e conecte-se com pessoas novas!
              </p>
              <Button onClick={() => navigate({ to: "/app/dashboard" })}>
                Iniciar primeira chamada
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Calcular estatísticas
  const totalDuration = calls.reduce((sum, call) => sum + (call.durationSeconds || 0), 0);
  const totalMinutes = Math.floor(totalDuration / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <AppLayout>
      <div className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-linear-to-br from-background via-background to-primary/5" />
        
        <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate({ to: "/app/dashboard" })}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Histórico de chamadas</h1>
            <p className="text-muted-foreground">Suas conversas anteriores</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtrar
          </Button>
        </header>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-2xl p-4 text-center">
            <Video className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{calls.length}</p>
            <p className="text-sm text-muted-foreground">Total de chamadas</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {hours > 0 ? `${hours}h ` : ''}{minutes}min
            </p>
            <p className="text-sm text-muted-foreground">Tempo total</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <Star className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">-</p>
            <p className="text-sm text-muted-foreground">Avaliação média</p>
          </div>
        </div>

        {/* Calls list */}
        <div className="space-y-6">
          {Object.entries(groupedCalls).map(([date, dateCalls]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">{date}</span>
              </div>
              
              <div className="space-y-2">
                {dateCalls.map((call) => {
                  // TODO: pegar userId do contexto de autenticação
                  const otherUserName = getOtherParticipantName(call, 1);
                  const duration = formatDuration(call.durationSeconds);
                  const time = formatTime(call.startedAt);
                  
                  return (
                    <div 
                      key={call.id}
                      className="glass glass-hover rounded-2xl p-4"
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-primary/30 to-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-lg font-medium">{otherUserName.charAt(0)}</span>
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{otherUserName}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{time}</span>
                            <span>•</span>
                            <span>{duration}</span>
                            <span>•</span>
                            <span className="capitalize">{call.callType.toLowerCase()}</span>
                          </div>
                        </div>
                        
                        {/* Rating - TODO: Implementar quando a API de ratings estiver pronta */}
                        <div className="flex items-center gap-1">
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <button
                                key={i}
                                onClick={() => handleRate(call.id, i + 1)}
                                className="hover:scale-110 transition-transform"
                                aria-label={`Avaliar com ${i + 1} estrelas`}
                              >
                                <Star className="w-4 h-4 text-muted-foreground hover:text-primary hover:fill-primary transition-colors" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </AppLayout>
  );
}
