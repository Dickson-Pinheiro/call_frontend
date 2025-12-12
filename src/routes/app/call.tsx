import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChatPanel, type Message } from "@/components/ChatPanel";
import { AppLayout } from "@/components/AppLayout";
import { requireAuth } from "@/lib/auth";
import { useCall } from "@/hooks/useCall";
import { useFollow, useUnfollow, useIsFollowing, getUserId } from "@/services";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  SkipForward,
  MessageCircle,
  Maximize2,
  Loader2,
  UserPlus,
  UserMinus
} from "lucide-react";

export const Route = createFileRoute('/app/call')({
  beforeLoad: requireAuth,
  component: RouteComponent,
})

function RouteComponent() {
  const {
    callState,
    peerName,
    peerId,
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

  const navigate = useNavigate();

  useEffect(() => {
    if (callState === 'idle') {
      navigate({ to: '/app/dashboard' });
    }
  }, [callState, navigate]);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastReadCount, setLastReadCount] = useState(0);

  const currentUserId = getUserId();
  const { data: isFollowingData } = useIsFollowing(currentUserId ?? 0, peerId ?? 0);
  const followMutation = useFollow();
  const unfollowMutation = useUnfollow();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const hasSetupVideoRef = useRef(false);

  // Configurar vídeos apenas uma vez quando os streams estiverem disponíveis
  useEffect(() => {
    // Resetar flag quando estado muda para não-connected
    if (callState !== 'connected') {
      hasSetupVideoRef.current = false;
      return;
    }

    // Evitar configurar múltiplas vezes
    if (hasSetupVideoRef.current) return;
    hasSetupVideoRef.current = true;

    // Configurar vídeo local
    const setupLocalVideo = () => {
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.play().catch(() => {
          // Silenciar erros de autoplay - navegador pode bloquear
        });
      }
    };

    // Configurar vídeo remoto
    const setupRemoteVideo = () => {
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(() => {
          // Silenciar erros de autoplay
        });
      }
    };

    // Pequeno delay para garantir que DOM está pronto
    const timeoutId = setTimeout(() => {
      setupLocalVideo();
      setupRemoteVideo();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [callState, localStream, remoteStream]);

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

  const handleToggleFollow = () => {
    if (!peerId || !currentUserId) return;

    if (isFollowingData?.isFollowing) {
      unfollowMutation.mutate({ followingId: peerId, userId: currentUserId });
    } else {
      followMutation.mutate({ followingId: peerId, userId: currentUserId });
    }
  };

  const isFollowing = isFollowingData?.isFollowing ?? false;
  const isFollowLoading = followMutation.isPending || unfollowMutation.isPending;

  if (callState === 'searching') {
    return (
      <AppLayout hideNav={true}>
        <div className="flex h-screen items-center justify-center relative overflow-hidden">
          {/* Background com gradiente */}
          <div className="absolute inset-0 bg-linear-to-br from-purple-900/20 via-background to-blue-900/20" />

          {/* Círculos decorativos de fundo */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10 text-center max-w-md mx-auto px-4">
            {/* Card com efeito glass */}
            <div className="glass rounded-3xl p-8 space-y-6">
              {/* Ícone animado */}
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 bg-linear-to-br from-purple-500/20 to-blue-500/20 rounded-full animate-ping" />
                <div className="relative flex items-center justify-center w-24 h-24 bg-linear-to-br from-purple-500/30 to-blue-500/30 rounded-full">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
                </div>
              </div>

              {/* Texto */}
              <div className="space-y-2">
                <h2 className="text-3xl font-bold bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Procurando alguém...
                </h2>
                <p className="text-muted-foreground">
                  Aguarde enquanto encontramos uma pessoa para você conversar
                </p>
              </div>

              {/* Indicadores de atividade */}
              <div className="flex justify-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>

              {/* Botão */}
              <Button
                variant="outline"
                onClick={stopSearching}
                className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors"
              >
                Cancelar Busca
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (callState === 'connecting') {
    return (
      <AppLayout hideNav={true}>
        <div className="flex h-screen items-center justify-center relative overflow-hidden">
          {/* Background com gradiente */}
          <div className="absolute inset-0 bg-linear-to-br from-emerald-900/20 via-background to-green-900/20" />

          {/* Círculos decorativos de fundo */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10 text-center max-w-md mx-auto px-4">
            {/* Card com efeito glass */}
            <div className="glass rounded-3xl p-8 space-y-6">
              {/* Avatar do peer */}
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 bg-linear-to-br from-emerald-500/20 to-green-500/20 rounded-full animate-ping" />
                <div className="relative flex items-center justify-center w-24 h-24 bg-linear-to-br from-emerald-500/30 to-green-500/30 rounded-full border-4 border-emerald-500/20">
                  {peerName ? (
                    <span className="text-3xl font-bold text-emerald-400">
                      {peerName.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
                  )}
                </div>
              </div>

              {/* Texto */}
              <div className="space-y-2">
                <h2 className="text-3xl font-bold bg-linear-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                  Conectando...
                </h2>
                <p className="text-muted-foreground">
                  Estabelecendo conexão com{' '}
                  <span className="font-semibold text-foreground">
                    {peerName || 'usuário'}
                  </span>
                </p>
              </div>

              {/* Barra de progresso animada */}
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-linear-to-r from-emerald-500 to-green-500 rounded-full animate-pulse"
                  style={{ width: '70%' }} />
              </div>

              {/* Status da conexão */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
                <span>Configurando conexão WebRTC</span>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (callState === 'connected') {
    return (
      <AppLayout hideNav={true}>
        <div className="flex flex-col bg-background relative overflow-hidden" style={{ minHeight: '100vh' }}>
          {/* Header com nome e botão de seguir */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-linear-to-b from-black/60 to-transparent p-4">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
              <div className="text-white">
                <h2 className="text-xl font-semibold">{peerName || 'Usuário'}</h2>
              </div>
              <Button
                variant={isFollowing ? "secondary" : "default"}
                size="sm"
                onClick={handleToggleFollow}
                disabled={isFollowLoading || !peerId}
                className="gap-2"
              >
                {isFollowLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    Deixar de seguir
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Seguir
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-black flex items-center justify-center">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
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
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
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

  // Fallback para estados inesperados - redirecionar para dashboard
  if (callState === 'idle') {
    return (
      <AppLayout hideNav={true}>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">Redirecionando...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Estado desconhecido
  return (
    <AppLayout hideNav={true}>
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Estado: {callState}</p>
        </div>
      </div>
    </AppLayout>
  );
}
