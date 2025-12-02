import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Video, 
  ArrowLeft, 
  Star,
  Calendar,
  Clock,
  Filter
} from "lucide-react";

export const Route = createFileRoute('/app/history')({
  component: RouteComponent,
})

interface CallRecord {
  id: string;
  name: string;
  duration: string;
  date: string;
  time: string;
  rating: number | null;
}

function RouteComponent() {
  const navigate = useNavigate();
  const [calls, setCalls] = useState<CallRecord[]>([
    { id: "1", name: "Maria Silva", duration: "12:34", date: "Hoje", time: "14:30", rating: 5 },
    { id: "2", name: "João Pedro", duration: "5:21", date: "Hoje", time: "12:15", rating: 4 },
    { id: "3", name: "Ana Lucia", duration: "18:45", date: "Hoje", time: "10:00", rating: 5 },
    { id: "4", name: "Carlos M.", duration: "3:12", date: "Ontem", time: "22:30", rating: null },
    { id: "5", name: "Fernanda R.", duration: "25:18", date: "Ontem", time: "20:00", rating: 4 },
    { id: "6", name: "Lucas S.", duration: "8:45", date: "Ontem", time: "18:30", rating: 3 },
    { id: "7", name: "Patrícia L.", duration: "15:22", date: "23 Nov", time: "16:00", rating: 5 },
    { id: "8", name: "Roberto A.", duration: "7:33", date: "23 Nov", time: "14:30", rating: null },
  ]);

  const handleRate = (id: string, rating: number) => {
    setCalls(calls.map(call => 
      call.id === id ? { ...call, rating } : call
    ));
  };

  const groupedCalls = calls.reduce((acc, call) => {
    if (!acc[call.date]) acc[call.date] = [];
    acc[call.date].push(call);
    return acc;
  }, {} as Record<string, CallRecord[]>);

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
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
            <p className="text-2xl font-bold">1h 36min</p>
            <p className="text-sm text-muted-foreground">Tempo total</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <Star className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">4.3</p>
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
                {dateCalls.map((call) => (
                  <div 
                    key={call.id}
                    className="glass glass-hover rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-linear-to-br from-primary/30 to-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-lg font-medium">{call.name.charAt(0)}</span>
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{call.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{call.time}</span>
                          <span>•</span>
                          <span>{call.duration}</span>
                        </div>
                      </div>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        {call.rating ? (
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < call.rating! ? 'text-primary fill-primary' : 'text-muted-foreground'}`}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <button
                                key={i}
                                onClick={() => handleRate(call.id, i + 1)}
                                className="hover:scale-110 transition-transform"
                              >
                                <Star className="w-4 h-4 text-muted-foreground hover:text-primary hover:fill-primary transition-colors" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
