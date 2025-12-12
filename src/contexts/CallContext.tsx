import { createContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useWebSocket, type MatchFound, type WebRTCSignal, getUserId } from '@/services';
import { useNavigate } from '@tanstack/react-router';
import { useCallChat, type ChatMessageUI } from '@/hooks/useCallChat';
import { useWebRTC, type CallState } from '@/hooks/useWebRTC';

export type { CallState, ChatMessageUI };

interface CallContextValue {
  // Estado
  callState: CallState;
  currentCallId: number | null;
  peerId: number | null;
  peerName: string | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;

  // Refs para os streams
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;

  // Chat
  messages: ChatMessageUI[];
  isTyping: boolean;

  // Ações
  startSearching: () => void;
  stopSearching: () => void;
  nextPerson: () => void;
  endCall: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  sendChatMessage: (message: string) => void;
  sendTypingIndicator: () => void;
}

const CallContext = createContext<CallContextValue | null>(null);

interface CallProviderProps {
  children: ReactNode;
}

export function CallProvider({ children }: CallProviderProps) {
  const navigate = useNavigate();

  // Estado principal
  const [callState, setCallState] = useState<CallState>('idle');
  const [currentCallId, setCurrentCallId] = useState<number | null>(null);
  const [peerId, setPeerId] = useState<number | null>(null);
  const [peerName, setPeerName] = useState<string | null>(null);

  // WebSocket
  const {
    connect,
    joinQueue,
    leaveQueue,
    nextPerson: wsNextPerson,
    endCall: wsEndCall,
    sendWebRTCSignal,
    sendChatMessage: wsSendChatMessage,
    sendTyping: wsSendTyping,
    updateHandlers,
    isConnected,
  } = useWebSocket({
    autoConnect: false,
    autoDisconnect: false,
  });

  // Hooks encapsulados
  const {
    messages,
    isTyping,
    addMessage,
    // clearMessages, // usado internamente no cleanup
    handleTyping,
    cleanupChat
  } = useCallChat();

  const {
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    initializeWebRTC,
    handleWebRTCSignal,
    cleanupWebRTC,
    toggleVideo,
    toggleAudio
  } = useWebRTC({
    currentCallId,
    peerId,
    sendWebRTCSignal,
    onCallStateChange: setCallState,
    navigate,
  });

  // Limpar recursos da chamada
  const cleanupCall = useCallback(() => {
    console.log('🧹 Limpando recursos da chamada da camada de contexto');
    setCurrentCallId(null);
    setPeerId(null);
    setPeerName(null);
    cleanupWebRTC();
    cleanupChat();
  }, [cleanupWebRTC, cleanupChat]);

  // Configurar handlers do WebSocket
  useEffect(() => {
    updateHandlers({
      onConnect: () => {
        console.log('✅ WebSocket conectado');
      },
      onStatus: (data) => {
        console.log('📊 Status:', data.message);
      },
      onMatchFound: async (data: MatchFound) => {
        console.log('🎯 Match encontrado:', data);

        // TODO: Melhorar validação de match duplicado se necessário
        // (a lógica original tinha checks de pcRef e currentCallId)

        setCurrentCallId(data.callId);
        setPeerId(data.peerId);
        setPeerName(data.peerName);
        setCallState('connecting');

        setTimeout(async () => {
          await initializeWebRTC(data.callId, data.peerId);
        }, 100);
      },
      onWebRTCSignal: async (signal: WebRTCSignal) => {
        await handleWebRTCSignal(signal);
      },
      onChatMessage: (data) => {
        const currentUserId = getUserId();
        const isMessageForMe = data.recipientId === currentUserId;
        if (!isMessageForMe) return;

        const newMessage: ChatMessageUI = {
          id: data.id.toString(),
          text: data.message,
          isOwn: false,
          time: new Date(data.sentAt).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          senderName: data.senderName,
        };
        addMessage(newMessage);
      },
      onTyping: (data) => {
        handleTyping(data.isTyping);
      },
      onCallEnded: (data) => {
        console.log('📞 Chamada encerrada:', data);
        cleanupCall();
        setCallState('idle');
        navigate({ to: '/app/dashboard' });
      },
      onError: (error) => {
        console.error('❌ Erro WebSocket:', error);
        alert(error.error);
      },
    });
  }, [updateHandlers, navigate, cleanupCall, handleWebRTCSignal, initializeWebRTC, addMessage, handleTyping]);

  // Iniciar busca
  const startSearching = useCallback(async () => {
    try {
      setCallState('searching');
      if (!isConnected()) {
        await connect();
      }
      joinQueue();
      navigate({ to: '/app/call' });
    } catch (error) {
      console.error('❌ Erro ao iniciar busca:', error);
      setCallState('idle');
    }
  }, [connect, joinQueue, isConnected, navigate]);

  // Parar busca
  const stopSearching = useCallback(() => {
    leaveQueue();
    setCallState('idle');
    navigate({ to: '/app/dashboard' });
  }, [leaveQueue, navigate]);

  // Próxima pessoa
  const nextPerson = useCallback(() => {
    cleanupCall();
    setCallState('searching');
    wsNextPerson();
  }, [cleanupCall, wsNextPerson]);

  // Encerrar chamada
  const endCall = useCallback(() => {
    if (currentCallId) {
      wsEndCall(currentCallId);
    }
    cleanupCall();
    setCallState('idle');
    navigate({ to: '/app/dashboard' });
  }, [currentCallId, wsEndCall, cleanupCall, navigate]);

  // Enviar mensagem de chat
  const sendChatMessage = useCallback((message: string) => {
    if (!currentCallId || !message.trim()) return;

    wsSendChatMessage(currentCallId, message);

    const newMessage: ChatMessageUI = {
      id: Date.now().toString(),
      text: message,
      isOwn: true,
      time: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
    };
    addMessage(newMessage);
  }, [currentCallId, wsSendChatMessage, addMessage]);

  // Enviar indicador de digitação
  const sendTypingIndicator = useCallback(() => {
    if (!currentCallId) return;
    wsSendTyping(currentCallId);
  }, [currentCallId, wsSendTyping]);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  const value: CallContextValue = {
    callState,
    currentCallId,
    peerId,
    peerName,
    isVideoEnabled,
    isAudioEnabled,
    localStream,
    remoteStream,
    messages,
    isTyping,
    startSearching,
    stopSearching,
    nextPerson,
    endCall,
    toggleVideo,
    toggleAudio,
    sendChatMessage,
    sendTypingIndicator,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export { CallContext };

