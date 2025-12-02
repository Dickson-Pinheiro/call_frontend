import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { requireAuth } from "@/lib/auth";
import { 
  Video, 
  History, 
  Users, 
  Play, 
  LogOut, 
  Settings,
  Zap
} from "lucide-react";

export const Route = createFileRoute('/app/dashboard')({
  beforeLoad: requireAuth,
  component: RouteComponent,
})

function RouteComponent() {
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const handleStartCall = () => {
    setIsSearching(true);
    setTimeout(() => {
      navigate({ to: "/app/call" });
    }, 2000);
  };

  const stats = [
    { label: "Chamadas hoje", value: "12", icon: Video },
    { label: "Usuários online", value: "2.4k", icon: Users },
    { label: "Tempo médio", value: "8min", icon: Zap },
  ];

  const recentCalls = [
    { name: "Maria S.", duration: "12:34", time: "Há 2h", rating: 5 },
    { name: "João P.", duration: "5:21", time: "Há 4h", rating: 4 },
    { name: "Ana L.", duration: "18:45", time: "Há 6h", rating: 5 },
  ];

  return (
    <AppLayout>
      <div className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-linear-to-br from-background via-background to-primary/5" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
        
        <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient">RandomCall</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Settings className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => navigate({ to: "/" })}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Main content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column - Start call */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero card */}
            <div className="glass rounded-3xl p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-transparent" />
              <div className="relative z-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  Pronto para conhecer <span className="text-gradient">alguém novo</span>?
                </h1>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Conecte-se instantaneamente com pessoas de todo o mundo através de chamadas de vídeo aleatórias.
                </p>
                
                <Button 
                  onClick={handleStartCall}
                  disabled={isSearching}
                  className="h-14 px-10 text-lg gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-all gradient-glow"
                >
                  {isSearching ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Iniciar chamada
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="glass glass-hover rounded-2xl p-4 text-center">
                  <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right column - Recent calls */}
          <div className="space-y-6">
            <div className="glass rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Chamadas recentes</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary hover:text-primary/80"
                  onClick={() => navigate({ to: "/app/history" })}
                >
                  <History className="w-4 h-4 mr-1" />
                  Ver todas
                </Button>
              </div>
              
              <div className="space-y-3">
                {recentCalls.map((call, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">{call.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{call.name}</p>
                      <p className="text-sm text-muted-foreground">{call.duration} • {call.time}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-2 h-2 rounded-full ${i < call.rating ? 'bg-primary' : 'bg-secondary'}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick tips */}
            <div className="glass rounded-3xl p-6">
              <h3 className="font-semibold mb-3">Dicas rápidas</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Verifique sua câmera e microfone antes de iniciar
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Seja respeitoso e educado com outros usuários
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Use o botão "Próximo" para encontrar novas pessoas
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      </div>
    </AppLayout>
  );
}
