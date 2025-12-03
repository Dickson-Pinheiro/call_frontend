import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChatPanel, type Message } from "@/components/ChatPanel";
import { AppLayout } from "@/components/AppLayout";
import { requireAuth } from "@/lib/auth";
import { useCall } from "@/hooks/useCall";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  SkipForward,
  MessageCircle,
  Maximize2,
  Loader2
} from "lucide-react";

export const Route = createFileRoute('/app/call')({
  beforeLoad: requireAuth,
  component: RouteComponent,
})

function RouteComponent() {
  const {
    callState,
    peerName,
    isVideoEnabled,
    isAudioEnabled,
    localStream,
    remoteStream,
    messages: chatMessages,
    isTyping,
    stopSearching,
    nextPerson,
    endCall,
    toggleVideo,
    toggleAudio,
    sendChatMessage,
    sendTypingIndicator,
  } = useCall();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastReadCount, setLastReadCount] = useState(0);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Callback ref para garantir que o vídeo local seja configurado quando o elemento é montado
  const setLocalVideoRef = useCallback((element: HTMLVideoElement | null) => {
    localVideoRef.current = element;
    
    if (element && localStream) {
      console.log('🎥 [Callback Ref] Configurando vídeo local');
      element.srcObject = localStream;
      element.play().catch(err => {
        console.error('❌ Erro ao reproduzir vídeo local:', err);
      });
    }
  }, [localStream]);

  // Debug: log das mudanças de estado
  useEffect(() => {
    console.log('🔍 Call Page - Estado atual:', {
      callState,
      hasLocalStream: !!localStream,
      hasRemoteStream: !!remoteStream,
      peerName
    });
  }, [callState, localStream, remoteStream, peerName]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log('🎥 Atribuindo localStream ao elemento de vídeo local');
      localVideoRef.current.srcObject = localStream;
      
      // Forçar play após atribuir o stream
      localVideoRef.current.play().catch(err => {
        console.error('❌ Erro ao reproduzir vídeo local:', err);
      });
    } else {
      console.log('⚠️ Não foi possível atribuir localStream:', {
        hasVideoRef: !!localVideoRef.current,
        hasLocalStream: !!localStream
      });
    }
  }, [localStream]);
  
  // Garantir que o vídeo local seja exibido quando o estado muda para 'connected'
  useEffect(() => {
    if (callState === 'connected' && localVideoRef.current && localStream) {
      console.log('🎥 Estado conectado: forçando atualização do vídeo local');
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(err => {
        console.error('❌ Erro ao reproduzir vídeo local:', err);
      });
    }
  }, [callState, localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log('🎥 Atribuindo remoteStream ao elemento de vídeo remoto:', {
        streamId: remoteStream.id,
        tracks: remoteStream.getTracks().map(t => ({
          kind: t.kind,
          enabled: t.enabled,
          readyState: t.readyState
        }))
      });
      remoteVideoRef.current.srcObject = remoteStream;
      
      // Forçar play após atribuir o stream
      remoteVideoRef.current.play().catch(err => {
        console.error('❌ Erro ao reproduzir vídeo remoto:', err);
      });
    } else {
      console.log('⚠️ Não foi possível atribuir remoteStream:', {
        hasVideoRef: !!remoteVideoRef.current,
        hasRemoteStream: !!remoteStream
      });
    }
  }, [remoteStream]);

  // Converter ChatMessageUI para Message (formato do ChatPanel)
  const messages: Message[] = chatMessages.map(msg => ({
    id: msg.id,
    text: msg.text,
    isOwn: msg.isOwn,
    time: msg.time,
  }));

  // Calcular mensagens não lidas (apenas mensagens recebidas depois de marcar como lido)
  const totalReceivedMessages = chatMessages.filter(msg => !msg.isOwn).length;
  const unreadCount = isChatOpen ? 0 : Math.max(0, totalReceivedMessages - lastReadCount);

  // Ao abrir o chat, marcar todas como lidas
  const handleToggleChat = () => {
    if (!isChatOpen) {
      // Abrindo o chat
      setIsChatOpen(true);
      setLastReadCount(chatMessages.filter(msg => !msg.isOwn).length);
    } else {
      // Fechando o chat
      setIsChatOpen(false);
    }
  };

  const handleSendMessage = (text: string) => {
    sendChatMessage(text);
  };

  if (callState === 'searching') {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Procurando alguém...
            </h2>
            <p className="text-gray-600 mb-6">
              Aguarde enquanto encontramos uma pessoa para você conversar
            </p>
            <Button variant="outline" onClick={stopSearching}>
              Cancelar
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (callState === 'connecting') {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-linear-to-br from-green-50 to-emerald-100">
          <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Conectando...
            </h2>
            <p className="text-gray-600">
              Estabelecendo conexão com {peerName || 'usuário'}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (callState === 'connected') {
    console.log('🎬 Renderizando página de chamada conectada:', {
      hasRemoteStream: !!remoteStream,
      hasLocalStream: !!localStream,
      remoteStreamTracks: remoteStream?.getTracks().length,
      localStreamTracks: localStream?.getTracks().length
    });
    
    return (
      <AppLayout>
        <div className="flex flex-col bg-background relative overflow-hidden -mx-4 -my-8" style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-black flex items-center justify-center">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  onLoadedMetadata={() => console.log('✅ Vídeo remoto: metadata carregada')}
                  onCanPlay={() => console.log('✅ Vídeo remoto: pode reproduzir')}
                  onError={(e) => console.error('❌ Erro no vídeo remoto:', e)}
                />
              ) : (
                <div className="text-center text-white">
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl font-bold text-primary">
                      {peerName?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <p className="text-xl font-medium">{peerName || 'Usuário'}</p>
                  <p className="text-muted-foreground">Conectando vídeo...</p>
                </div>
              )}
            </div>

            <div className="absolute bottom-24 right-4 md:bottom-8 md:right-8 w-32 h-44 md:w-48 md:h-64 rounded-2xl overflow-hidden shadow-2xl border-2 border-border/50">
              <div className="w-full h-full bg-black flex items-center justify-center">
                {localStream && isVideoEnabled ? (
                  <video
                    ref={setLocalVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    onLoadedMetadata={() => console.log('✅ Vídeo local: metadata carregada')}
                    onCanPlay={() => console.log('✅ Vídeo local: pode reproduzir')}
                  />
                ) : (
                  <VideoOff className="w-8 h-8 text-white" />
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

            <ChatPanel 
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              messages={messages}
              onSendMessage={handleSendMessage}
              isTyping={isTyping}
              onTyping={sendTypingIndicator}
            />
          </div>

          <div className="bg-card/95 backdrop-blur-sm border-t border-border px-4 py-4 md:px-8">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
              <div className="flex gap-2">
                <Button
                  variant={isChatOpen ? "default" : "secondary"}
                  size="icon"
                  className="w-12 h-12 rounded-full shadow-lg relative"
                  onClick={handleToggleChat}
                >
                  <MessageCircle className="w-5 h-5" />
                  {unreadCount > 0 && !isChatOpen && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </div>

              <div className="flex gap-3 md:gap-4">
                <Button
                  variant={isAudioEnabled ? "secondary" : "destructive"}
                  size="icon"
                  className="w-14 h-14 rounded-full shadow-lg transition-all hover:scale-105"
                  onClick={toggleAudio}
                >
                  {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>

                <Button
                  variant={isVideoEnabled ? "secondary" : "destructive"}
                  size="icon"
                  className="w-14 h-14 rounded-full shadow-lg transition-all hover:scale-105"
                  onClick={toggleVideo}
                >
                  {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>

                <Button
                  variant="default"
                  size="icon"
                  className="w-14 h-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 transition-all hover:scale-105"
                  onClick={nextPerson}
                >
                  <SkipForward className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="icon"
                  className="w-12 h-12 rounded-full shadow-lg transition-all hover:scale-105"
                  onClick={endCall}
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

  // Fallback para estados inesperados
  console.warn('⚠️ Estado inesperado na página de call:', callState);
  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Carregando...
          </h2>
          <p className="text-gray-600">
            Estado: {callState}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
