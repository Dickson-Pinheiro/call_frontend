import { createContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { useWebSocket, type MatchFound, type WebRTCSignal, getUserId } from '@/services';
import { useNavigate } from '@tanstack/react-router';

export type CallState = 'idle' | 'searching' | 'connecting' | 'connected' | 'ended';

export interface ChatMessageUI {
  id: string;
  text: string;
  isOwn: boolean;
  time: string;
  senderName?: string;
}

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
  
  // Estado
  const [callState, setCallState] = useState<CallState>('idle');
  const [currentCallId, setCurrentCallId] = useState<number | null>(null);
  const [peerId, setPeerId] = useState<number | null>(null);
  const [peerName, setPeerName] = useState<string | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  // Chat
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);

  // Configuração ICE servers
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

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

  // Limpar recursos da chamada
  const cleanupCall = useCallback(() => {
    console.log('🧹 Limpando recursos da chamada');
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setCurrentCallId(null);
    setPeerId(null);
    setPeerName(null);
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
    setMessages([]);
    setIsTyping(false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  // Processar sinais WebRTC recebidos
  const handleWebRTCSignal = useCallback(async (signal: WebRTCSignal) => {
    const pc = peerConnectionRef.current;
    if (!pc) {
      console.warn('⚠️ PeerConnection não existe ainda');
      return;
    }

    console.log('📡 Processando sinal WebRTC:', {
      type: signal.type,
      callId: signal.callId,
      peerConnectionState: pc.connectionState,
      iceConnectionState: pc.iceConnectionState,
      signalingState: pc.signalingState
    });

    try {
      if (signal.type === 'offer') {
        console.log('📥 Processando offer');
        
        // Perfect Negotiation: Se estamos criando uma offer, ignorar a recebida
        const offerCollision = (signal.type === 'offer') &&
                              (makingOfferRef.current || pc.signalingState !== 'stable');
        
        // Determinar quem é "polite" (userId menor aguarda)
        const currentUserId = getUserId();
        const isPolite = currentUserId !== null && peerId !== null && currentUserId < peerId;
        
        ignoreOfferRef.current = !isPolite && offerCollision;
        if (ignoreOfferRef.current) {
          console.log('⚠️ Ignorando offer (collision, somos impolite)');
          return;
        }
        
        await pc.setRemoteDescription(new RTCSessionDescription(signal.data as RTCSessionDescriptionInit));
        console.log('✅ RemoteDescription (offer) configurada');
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('✅ LocalDescription (answer) configurada');

        console.log('📤 Enviando answer');
        sendWebRTCSignal({
          type: 'answer',
          callId: currentCallId!,
          targetUserId: peerId!,
          data: answer,
        });
      } else if (signal.type === 'answer') {
        console.log('📥 Processando answer');
        await pc.setRemoteDescription(new RTCSessionDescription(signal.data as RTCSessionDescriptionInit));
        console.log('✅ RemoteDescription (answer) configurada');
      } else if (signal.type === 'ice-candidate') {
        console.log('🧊 Adicionando ICE candidate');
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.data as RTCIceCandidateInit));
          console.log('✅ ICE candidate adicionado');
        } catch (err) {
          if (!ignoreOfferRef.current) {
            console.error('❌ Erro ao adicionar ICE candidate:', err);
          }
        }
      }
      
      console.log('📊 Estado após processamento:', {
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
        signalingState: pc.signalingState
      });
    } catch (error) {
      console.error('❌ Erro ao processar sinal WebRTC:', error);
    }
  }, [sendWebRTCSignal, currentCallId, peerId]);

  // Inicializar WebRTC
  const initializeWebRTC = useCallback(async (callId: number, targetPeerId: number) => {
    try {
      // Verificar se a API está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          'Seu navegador não suporta acesso à câmera/microfone. ' +
          'Por favor, use um navegador moderno (Chrome, Firefox, Safari, Edge) ' +
          'e acesse via HTTPS ou localhost.'
        );
      }

      console.log('📹 Solicitando acesso à câmera e microfone...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
      });

      console.log('✅ Acesso concedido à mídia');
      localStreamRef.current = stream;
      setLocalStream(stream);
      
      console.log('📹 LocalStream configurado:', {
        id: stream.id,
        tracks: stream.getTracks().map(t => ({
          kind: t.kind,
          enabled: t.enabled,
          readyState: t.readyState
        }))
      });

      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;
      
      console.log('🔌 PeerConnection criada:', {
        signalingState: pc.signalingState,
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState
      });

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        console.log('📹 Remote track recebido:', {
          streams: event.streams,
          streamCount: event.streams.length,
          track: event.track,
          trackKind: event.track.kind,
          trackEnabled: event.track.enabled,
          trackReadyState: event.track.readyState
        });
        
        if (event.streams && event.streams[0]) {
          console.log('✅ Configurando remoteStream:', {
            streamId: event.streams[0].id,
            tracks: event.streams[0].getTracks().map(t => ({
              kind: t.kind,
              enabled: t.enabled,
              readyState: t.readyState
            }))
          });
          setRemoteStream(event.streams[0]);
          // Garantir que o estado mude para connected quando receber remote stream
          setCallState((prevState) => {
            console.log('🔄 Mudando estado de', prevState, 'para connected (remote stream recebido)');
            return 'connected';
          });
        } else {
          console.warn('⚠️ Nenhum stream recebido no evento ontrack');
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 Enviando ICE candidate');
          sendWebRTCSignal({
            type: 'ice-candidate',
            callId,
            targetUserId: targetPeerId,
            data: event.candidate.toJSON(),
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('ICE Connection State:', pc.iceConnectionState);
        
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          console.log('🔄 ICE conectado, mudando para estado connected');
          setCallState((prevState) => {
            if (prevState !== 'connected') {
              console.log('✅ Mudando de', prevState, 'para connected (ICE)');
              return 'connected';
            }
            return prevState;
          });
        } else if (pc.iceConnectionState === 'disconnected') {
          console.warn('⚠️ Conexão ICE desconectada');
        } else if (pc.iceConnectionState === 'failed') {
          console.error('❌ Falha na conexão ICE');
          alert('Falha na conexão. Tentando reconectar...');
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection State:', pc.connectionState);
        
        if (pc.connectionState === 'connected') {
          console.log('✅ PeerConnection conectada');
          setCallState((prevState) => {
            if (prevState !== 'connected') {
              console.log('✅ Mudando de', prevState, 'para connected (PeerConnection)');
              return 'connected';
            }
            return prevState;
          });
        } else if (pc.connectionState === 'failed') {
          console.error('❌ Falha na conexão');
          alert('Não foi possível estabelecer a conexão.');
        }
      };

      // Perfect Negotiation: apenas o peer "impolite" (userId maior) cria a offer inicial
      const currentUserId = getUserId();
      const shouldCreateOffer = currentUserId !== null && currentUserId > targetPeerId;
      
      console.log('🎯 Estratégia de negociação:', {
        currentUserId,
        targetPeerId,
        shouldCreateOffer,
        role: shouldCreateOffer ? 'impolite (cria offer)' : 'polite (aguarda offer)'
      });

      if (shouldCreateOffer) {
        console.log('📤 Criando e enviando offer (somos impolite)');
        makingOfferRef.current = true;
        
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          console.log('📤 Enviando offer');
          sendWebRTCSignal({
            type: 'offer',
            callId,
            targetUserId: targetPeerId,
            data: offer,
          });
        } finally {
          makingOfferRef.current = false;
        }
      } else {
        console.log('⏳ Aguardando offer do peer (somos polite)');
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar WebRTC:', error);
      
      let errorMessage = 'Erro ao acessar câmera/microfone.';
      
      if (error instanceof Error) {
        // Mensagens específicas para erros conhecidos
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage = 'Permissão negada. Por favor, permita o acesso à câmera e ao microfone.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage = 'Câmera ou microfone não encontrados. Verifique se estão conectados.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMessage = 'Não foi possível acessar a câmera/microfone. Outro aplicativo pode estar usando.';
        } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
          errorMessage = 'Configurações de vídeo/áudio não suportadas pelo seu dispositivo.';
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      alert(errorMessage);
      cleanupCall();
      setCallState('idle');
      navigate({ to: '/app/dashboard' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendWebRTCSignal, cleanupCall, navigate]);

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
        setCurrentCallId(data.callId);
        setPeerId(data.peerId);
        setPeerName(data.peerName);
        setCallState('connecting');
        
        // Pequeno delay para garantir que o estado seja atualizado antes de inicializar WebRTC
        setTimeout(async () => {
          await initializeWebRTC(data.callId, data.peerId);
        }, 100);
      },
      onWebRTCSignal: async (signal: WebRTCSignal) => {
        console.log('📡 WebRTC Signal recebido:', signal.type);
        await handleWebRTCSignal(signal);
      },
      onChatMessage: (data) => {
        console.log('💬 Mensagem de chat recebida:', {
          messageId: data.id,
          senderId: data.senderId,
          senderName: data.senderName,
          message: data.message,
          sentAt: data.sentAt
        });
        
        // Obter userId do localStorage
        const currentUserId = getUserId();
        console.log('👤 Current User ID:', currentUserId);
        console.log('📤 Sender ID:', data.senderId);
        console.log('🔍 Comparação:', {
          currentUserId,
          senderId: data.senderId,
          areEqual: currentUserId === data.senderId,
          types: {
            currentUserId: typeof currentUserId,
            senderId: typeof data.senderId
          }
        });
        
        // Verificar se a mensagem foi enviada pelo próprio usuário
        const isOwnMessage = currentUserId !== null && data.senderId === currentUserId;
        
        // Se for mensagem própria, não adicionar (já foi adicionada localmente)
        if (isOwnMessage) {
          console.log('📝 Mensagem própria detectada, ignorando duplicação');
          return;
        }
        
        console.log('✅ Adicionando mensagem de outro usuário');
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
        setMessages(prev => [...prev, newMessage]);
      },
      onTyping: (data) => {
        console.log('⌨️ Indicador de digitação:', data.isTyping);
        setIsTyping(data.isTyping);
        
        // Auto-limpar depois de 3 segundos
        if (data.isTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 3000);
        }
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
  }, [updateHandlers, navigate, cleanupCall, handleWebRTCSignal, initializeWebRTC]);

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

  // Toggle vídeo
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  // Toggle áudio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  // Enviar mensagem de chat
  const sendChatMessage = useCallback((message: string) => {
    if (!currentCallId || !message.trim()) return;
    
    const currentUserId = getUserId();
    console.log('📤 Enviando mensagem de chat:', {
      message,
      callId: currentCallId,
      currentUserId,
      userIdType: typeof currentUserId
    });
    
    wsSendChatMessage(currentCallId, message);
    
    // Adicionar mensagem própria à lista
    const newMessage: ChatMessageUI = {
      id: Date.now().toString(),
      text: message,
      isOwn: true,
      time: new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    };
    console.log('✅ Mensagem adicionada localmente:', newMessage);
    setMessages(prev => [...prev, newMessage]);
  }, [currentCallId, wsSendChatMessage]);

  // Enviar indicador de digitação
  const sendTypingIndicator = useCallback(() => {
    if (!currentCallId) return;
    
    wsSendTyping(currentCallId);
  }, [currentCallId, wsSendTyping]);

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
