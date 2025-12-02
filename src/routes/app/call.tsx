import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChatPanel, type Message } from "@/components/ChatPanel";
import { AppLayout } from "@/components/AppLayout";
import { requireAuth } from "@/lib/auth";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  SkipForward,
  MessageCircle,
  Maximize2
} from "lucide-react";

export const Route = createFileRoute('/app/call')({
  beforeLoad: requireAuth,
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Olá! Como você está?", isOwn: false, time: "14:32" },
    { id: "2", text: "Oi! Tudo bem e você?", isOwn: true, time: "14:32" },
    { id: "3", text: "Muito bem! De onde você é?", isOwn: false, time: "14:33" },
  ]);

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text: text,
      isOwn: true,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };
    
    setMessages([...messages, newMessage]);
  };

  const handleEndCall = () => {
    navigate({ to: "/app/dashboard" });
  };

  const handleNextPerson = () => {
    // Simulate finding next person
    setMessages([]);
  };

  return (
    <AppLayout>
      <div className="flex flex-col bg-background relative overflow-hidden -mx-4 -my-8" style={{ minHeight: 'calc(100vh - 4rem)' }}>
        {/* Main video area */}
        <div className="flex-1 relative">
        {/* Remote video (placeholder) */}
        <div className="absolute inset-0 bg-linear-to-br from-secondary to-card flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl font-bold text-primary">M</span>
            </div>
            <p className="text-xl font-medium">Maria Silva</p>
            <p className="text-muted-foreground">Conectado</p>
          </div>
        </div>

        {/* Local video (small) */}
        <div className="absolute bottom-24 right-4 md:bottom-8 md:right-8 w-32 h-44 md:w-48 md:h-64 rounded-2xl overflow-hidden shadow-2xl border-2 border-border/50">
          <div className={`w-full h-full ${isVideoOn ? 'bg-linear-to-br from-card to-secondary' : 'bg-card'} flex items-center justify-center`}>
            {isVideoOn ? (
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <span className="text-lg font-bold text-primary">V</span>
                </div>
              </div>
            ) : (
              <VideoOff className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 w-6 h-6 bg-background/50 backdrop-blur-sm"
          >
            <Maximize2 className="w-3 h-3" />
          </Button>
        </div>

        {/* Chat panel */}
        <ChatPanel 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="glass rounded-2xl p-4 flex items-center justify-center gap-3 md:gap-4">
            {/* Toggle mic */}
            <Button
              variant={isMicOn ? "secondary" : "destructive"}
              size="icon"
              className="w-12 h-12 rounded-full"
              onClick={() => setIsMicOn(!isMicOn)}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>
            
            {/* Toggle video */}
            <Button
              variant={isVideoOn ? "secondary" : "destructive"}
              size="icon"
              className="w-12 h-12 rounded-full"
              onClick={() => setIsVideoOn(!isVideoOn)}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>
            
            {/* Chat */}
            <Button
              variant={isChatOpen ? "default" : "secondary"}
              size="icon"
              className={`w-12 h-12 rounded-full ${isChatOpen ? 'gradient-primary' : ''}`}
              onClick={() => setIsChatOpen(!isChatOpen)}
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
            
            {/* Next person */}
            <Button
              variant="outline"
              className="h-12 px-6 rounded-full gap-2 border-primary text-primary hover:bg-primary/10"
              onClick={handleNextPerson}
            >
              <SkipForward className="w-5 h-5" />
              <span className="hidden md:inline">Próximo</span>
            </Button>
            
            {/* End call */}
            <Button
              variant="destructive"
              size="icon"
              className="w-12 h-12 rounded-full"
              onClick={handleEndCall}
            >
              <Phone className="w-5 h-5 rotate-135" />
            </Button>
          </div>
        </div>
      </div>
      </div>
    </AppLayout>
  );
}
