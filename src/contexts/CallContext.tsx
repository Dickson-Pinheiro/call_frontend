import { createContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { useWebSocket, type MatchFound, type WebRTCSignal } from '@/services';
import { useNavigate } from '@tanstack/react-router';

export type CallState = 'idle' | 'searching' | 'connecting' | 'connected' | 'ended';

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
  
  // Ações
  startSearching: () => void;
  stopSearching: () => void;
  nextPerson: () => void;
  endCall: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
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

  // Refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

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
  }, []);

  // Processar sinais WebRTC recebidos
  const handleWebRTCSignal = useCallback(async (signal: WebRTCSignal) => {
    const pc = peerConnectionRef.current;
    if (!pc) {
      console.warn('PeerConnection não existe ainda');
      return;
    }

    try {
      if (signal.type === 'offer') {
        console.log('📥 Processando offer');
        await pc.setRemoteDescription(new RTCSessionDescription(signal.data as RTCSessionDescriptionInit));
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

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
      } else if (signal.type === 'ice-candidate') {
        console.log('🧊 Adicionando ICE candidate');
        await pc.addIceCandidate(new RTCIceCandidate(signal.data as RTCIceCandidateInit));
      }
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
        video: true,
        audio: true,
      });

      console.log('✅ Acesso concedido à mídia');
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        console.log('📹 Remote track recebido');
        setRemoteStream(event.streams[0]);
        setCallState('connected');
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
        
        if (pc.iceConnectionState === 'connected') {
          setCallState('connected');
        } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          console.warn('Conexão perdida');
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log('📤 Enviando offer');
      sendWebRTCSignal({
        type: 'offer',
        callId,
        targetUserId: targetPeerId,
        data: offer,
      });
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
        
        await initializeWebRTC(data.callId, data.peerId);
      },
      onWebRTCSignal: async (signal: WebRTCSignal) => {
        console.log('📡 WebRTC Signal recebido:', signal.type);
        await handleWebRTCSignal(signal);
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

  const value: CallContextValue = {
    callState,
    currentCallId,
    peerId,
    peerName,
    isVideoEnabled,
    isAudioEnabled,
    localStream,
    remoteStream,
    startSearching,
    stopSearching,
    nextPerson,
    endCall,
    toggleVideo,
    toggleAudio,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export { CallContext };
