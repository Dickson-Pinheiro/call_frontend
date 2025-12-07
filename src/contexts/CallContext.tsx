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
  const pendingSignalsRef = useRef<WebRTCSignal[]>([]); // Fila para sinais que chegam antes do PC estar pronto

  // Configuração ICE servers
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      // Google STUN servers
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
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

    // Limpar fila de sinais pendentes
    if (pendingSignalsRef.current.length > 0) {
      console.log('🗑️ Descartando', pendingSignalsRef.current.length, 'sinais pendentes');
      pendingSignalsRef.current = [];
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
    console.log('🚨 handleWebRTCSignal CHAMADO:', {
      type: signal.type,
      callId: signal.callId,
      senderId: signal.senderId,
      hasPeerConnection: !!peerConnectionRef.current,
      timestamp: new Date().toISOString()
    });
    
    const pc = peerConnectionRef.current;
    if (!pc) {
      console.warn('⚠️ PeerConnection não existe ainda - adicionando sinal à fila');
      console.log('📋 Sinal enfileirado:', {
        type: signal.type,
        callId: signal.callId,
        senderId: signal.senderId,
        queueLength: pendingSignalsRef.current.length + 1
      });
      pendingSignalsRef.current.push(signal);
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
        console.log('📥 Offer recebida!');
        console.log('📊 Estado ANTES de processar offer:', {
          signalingState: pc.signalingState,
          connectionState: pc.connectionState,
          iceConnectionState: pc.iceConnectionState,
          hasRemoteDescription: !!pc.remoteDescription
        });
        
        // 🛡️ PROTEÇÃO: Se já temos remoteDescription, ignorar offers duplicadas
        if (pc.remoteDescription) {
          console.warn('⚠️ Ignorando offer duplicada - remoteDescription já configurada');
          return;
        }
        
        // 🛡️ PROTEÇÃO: Se já processamos answer (signaling stable), ignorar offers
        if (pc.signalingState === 'stable' && pc.remoteDescription) {
          console.warn('⚠️ Ignorando offer duplicada - negociação já concluída');
          return;
        }
        
        // Perfect Negotiation: Se estamos criando uma offer, ignorar a recebida
        const offerCollision = (signal.type === 'offer') &&
                              (makingOfferRef.current || pc.signalingState !== 'stable');
        
        console.log('🔍 Verificando colisão:', {
          makingOffer: makingOfferRef.current,
          signalingState: pc.signalingState,
          hasCollision: offerCollision
        });
        
        // Determinar quem é "polite" (userId menor aguarda)
        const currentUserId = getUserId();
        const isPolite = currentUserId !== null && peerId !== null && currentUserId < peerId;
        
        console.log('🎭 Papel na negociação:', {
          currentUserId,
          peerId,
          isPolite: isPolite ? 'SIM (aceita collision)' : 'NÃO (rejeita collision)'
        });
        
        ignoreOfferRef.current = !isPolite && offerCollision;
        if (ignoreOfferRef.current) {
          console.log('⚠️ Ignorando offer (collision, somos impolite)');
          return;
        }
        
        console.log('✅ Processando offer...');
        await pc.setRemoteDescription(new RTCSessionDescription(signal.data as RTCSessionDescriptionInit));
        console.log('✅ RemoteDescription (offer) configurada');
        
        console.log('🔨 Criando answer...');
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('✅ LocalDescription (answer) configurada');

        console.log('📤 Enviando answer via WebSocket...');
        sendWebRTCSignal({
          type: 'answer',
          callId: currentCallId!,
          targetUserId: peerId!,
          data: answer,
        });
        console.log('✅ Answer enviado com sucesso');
        
        console.log('📊 Estado DEPOIS de processar offer:', {
          signalingState: pc.signalingState,
          connectionState: pc.connectionState,
          iceConnectionState: pc.iceConnectionState
        });
      } else if (signal.type === 'answer') {
        console.log('📥 Processando answer recebido');
        console.log('📊 Estado ANTES de processar answer:', {
          signalingState: pc.signalingState,
          connectionState: pc.connectionState,
          iceConnectionState: pc.iceConnectionState,
          hasRemoteDescription: !!pc.remoteDescription
        });
        
        // 🛡️ PROTEÇÃO: Se já temos remoteDescription, ignorar answers duplicados
        if (pc.remoteDescription) {
          console.warn('⚠️ Ignorando answer duplicado - remoteDescription já configurada');
          return;
        }
        
        // 🛡️ PROTEÇÃO: Se não estamos esperando answer, ignorar
        if (pc.signalingState !== 'have-local-offer') {
          console.warn('⚠️ Ignorando answer - não estamos esperando (signalingState:', pc.signalingState, ')');
          return;
        }
        
        await pc.setRemoteDescription(new RTCSessionDescription(signal.data as RTCSessionDescriptionInit));
        console.log('✅ RemoteDescription (answer) configurada com sucesso');
        console.log('📊 Estado DEPOIS de processar answer:', {
          signalingState: pc.signalingState,
          connectionState: pc.connectionState,
          iceConnectionState: pc.iceConnectionState
        });
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
        console.log('➕ Adicionando track local:', {
          kind: track.kind,
          enabled: track.enabled,
          id: track.id
        });
        pc.addTrack(track, stream);
      });
      
      console.log('✅ Todos os tracks locais adicionados ao PeerConnection');

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
          const stream = event.streams[0];
          console.log('✅ Configurando remoteStream:', {
            streamId: stream.id,
            tracks: stream.getTracks().map(t => ({
              kind: t.kind,
              enabled: t.enabled,
              readyState: t.readyState,
              id: t.id
            })),
            trackCount: stream.getTracks().length
          });
          
          // Importante: Sempre atualizar o remoteStream quando receber um novo track
          // pois o stream pode ser recebido em partes (primeiro vídeo, depois áudio ou vice-versa)
          setRemoteStream(stream);
          
          console.log('✅ RemoteStream atualizado no estado');
          
          // Garantir que o estado mude para connected quando receber remote stream
          setCallState((prevState) => {
            console.log('🔄 Mudando estado de', prevState, 'para connected (remote stream recebido)');
            return 'connected';
          });
        } else {
          console.warn('⚠️ Nenhum stream recebido no evento ontrack');
        }
      };

      pc.onsignalingstatechange = () => {
        console.log('🔄 Signaling State mudou:', pc.signalingState);
        
        // Quando signaling state volta para 'stable', a negociação foi concluída
        if (pc.signalingState === 'stable') {
          console.log('✅ Signaling State é stable - negociação concluída');
          
          // Se já temos remote description, podemos considerar a conexão estabelecida
          if (pc.remoteDescription) {
            console.log('📡 Remote description presente, verificando se devemos conectar...');
            
            // Dar um pequeno delay para ICE candidates serem trocados
            setTimeout(() => {
              const currentIceState = pc.iceConnectionState;
              const currentConnState = pc.connectionState;
              
              console.log('🔍 Verificação após signaling stable:', {
                iceConnectionState: currentIceState,
                connectionState: currentConnState,
                hasRemoteDescription: !!pc.remoteDescription
              });
              
              // Se ICE está em um estado que pode funcionar, conectar
              if (currentIceState === 'checking' || 
                  currentIceState === 'connected' || 
                  currentIceState === 'completed') {
                console.log('✅ ICE em estado válido, garantindo transição para connected');
                setCallState((prevState) => {
                  if (prevState === 'connecting') {
                    console.log('🎯 Mudando de connecting para connected (signaling stable + ICE válido)');
                    return 'connected';
                  }
                  return prevState;
                });
              }
            }, 1000);
          }
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate;
          const candidateStr = candidate.candidate;
          
          // Extrair tipo de candidate (host, srflx, relay)
          let candidateType = 'unknown';
          if (candidateStr.includes('typ host')) candidateType = 'host';
          else if (candidateStr.includes('typ srflx')) candidateType = 'srflx (STUN)';
          else if (candidateStr.includes('typ relay')) candidateType = 'relay (TURN)';
          
          console.log('🧊 ICE candidate gerado:', {
            type: candidateType,
            protocol: candidate.protocol,
            address: candidate.address,
            port: candidate.port,
            priority: candidate.priority,
            candidateString: candidateStr.substring(0, 80) + '...'
          });
          
          console.log('📤 Enviando ICE candidate para peer');
          sendWebRTCSignal({
            type: 'ice-candidate',
            callId,
            targetUserId: targetPeerId,
            data: event.candidate.toJSON(),
          });
        } else {
          console.log('✅ Coleta de ICE candidates concluída (candidate=null)');
        }
      };

      pc.onicegatheringstatechange = () => {
        console.log('🧊 ICE Gathering State mudou:', pc.iceGatheringState);
        
        if (pc.iceGatheringState === 'complete') {
          console.log('✅ Coleta de ICE candidates completa');
        } else if (pc.iceGatheringState === 'gathering') {
          console.log('🔍 Coletando ICE candidates...');
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('🔌 ICE Connection State mudou:', pc.iceConnectionState, {
          connectionState: pc.connectionState,
          signalingState: pc.signalingState
        });
        
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          console.log('🎉 ICE conectado com sucesso! Mudando para estado connected');
          setCallState((prevState) => {
            if (prevState !== 'connected') {
              console.log('✅ Mudando de', prevState, 'para connected (ICE)');
              return 'connected';
            }
            return prevState;
          });
        } else if (pc.iceConnectionState === 'checking') {
          console.log('🔍 ICE está verificando conectividade...');
          
          // Se ICE está checking por muito tempo (5s) e signaling está stable, conectar
          setTimeout(() => {
            if (pc.iceConnectionState === 'checking' && pc.signalingState === 'stable') {
              console.log('⚠️ ICE ainda em checking após 5s, mas signaling stable - conectando mesmo assim');
              setCallState((prevState) => {
                if (prevState === 'connecting') {
                  console.log('🔧 Mudando para connected (ICE checking + signaling stable)');
                  return 'connected';
                }
                return prevState;
              });
            }
          }, 5000);
        } else if (pc.iceConnectionState === 'disconnected') {
          console.warn('⚠️ Conexão ICE desconectada - aguardando reconexão automática...');
        } else if (pc.iceConnectionState === 'failed') {
          console.error('❌ Falha na conexão ICE:', {
            connectionState: pc.connectionState,
            signalingState: pc.signalingState,
            iceGatheringState: pc.iceGatheringState,
            localDescription: !!pc.localDescription,
            remoteDescription: !!pc.remoteDescription
          });
          
          // Tentar restart ICE antes de desistir
          console.log('🔄 Tentando restart ICE...');
          pc.restartIce();
          
          // Se falhar novamente após 5 segundos, mostrar erro
          setTimeout(() => {
            if (pc.iceConnectionState === 'failed') {
              console.error('❌ ICE continua falhando após restart');
              alert('Falha na conexão ICE. Verifique sua conexão de internet ou firewall.');
            }
          }, 5000);
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('🔌 Connection State mudou:', pc.connectionState, {
          iceConnectionState: pc.iceConnectionState,
          signalingState: pc.signalingState
        });
        
        if (pc.connectionState === 'connected') {
          console.log('✅ PeerConnection conectada com sucesso!');
          setCallState((prevState) => {
            if (prevState !== 'connected') {
              console.log('✅ Mudando de', prevState, 'para connected (PeerConnection)');
              return 'connected';
            }
            return prevState;
          });
        } else if (pc.connectionState === 'connecting') {
          console.log('🔄 PeerConnection conectando...');
        } else if (pc.connectionState === 'disconnected') {
          console.warn('⚠️ PeerConnection desconectada');
        } else if (pc.connectionState === 'failed') {
          // 🛡️ PROTEÇÃO: Se ICE está connected/completed, NÃO considerar como falha
          if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            console.warn('⚠️ Connection State = failed, mas ICE está conectado - ignorando falha espúria');
            return;
          }
          
          console.error('❌ PeerConnection falhou:', {
            iceConnectionState: pc.iceConnectionState,
            signalingState: pc.signalingState,
            iceGatheringState: pc.iceGatheringState,
            localDescription: !!pc.localDescription,
            remoteDescription: !!pc.remoteDescription
          });
          
          // Não mostrar alert imediatamente, aguardar para ver se ICE restart resolve
          console.log('⏳ Aguardando possível recuperação...');
          
          setTimeout(() => {
            if (pc.connectionState === 'failed') {
              console.error('❌ Conexão continua falhando');
              alert('Não foi possível estabelecer a conexão. Possíveis causas:\n\n' +
                    '• Problemas de rede\n' +
                    '• Firewall bloqueando WebRTC\n' +
                    '• NAT restritivo\n\n' +
                    'Tente reconectar ou usar outra rede.');
            }
          }, 3000);
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
        console.log('📤 Iniciando criação de offer (somos impolite)');
        makingOfferRef.current = true;
        
        try {
          console.log('🔨 Criando offer...');
          const offer = await pc.createOffer();
          console.log('✅ Offer criada:', {
            type: offer.type,
            sdp: offer.sdp?.substring(0, 100) + '...'
          });
          
          console.log('📝 Configurando LocalDescription...');
          await pc.setLocalDescription(offer);
          console.log('✅ LocalDescription configurada:', {
            signalingState: pc.signalingState,
            iceGatheringState: pc.iceGatheringState
          });

          console.log('📡 Enviando offer via WebSocket...');
          sendWebRTCSignal({
            type: 'offer',
            callId,
            targetUserId: targetPeerId,
            data: offer,
          });
          console.log('✅ Offer enviada com sucesso');
          
          // Adicionar timeout para detectar se a answer não chega
          setTimeout(() => {
            if (pc.signalingState === 'have-local-offer') {
              console.error('❌ PROBLEMA: Offer foi enviada mas answer não chegou!');
              console.error('📊 Estado atual:', {
                signalingState: pc.signalingState,
                iceConnectionState: pc.iceConnectionState,
                connectionState: pc.connectionState
              });
              console.error('🔍 Possíveis causas:');
              console.error('  1. Backend não está encaminhando o sinal WebRTC');
              console.error('  2. Peer remoto não está recebendo a offer');
              console.error('  3. Subscription /user/queue/webrtc-signal não está funcionando');
            }
          }, 8000);
        } catch (offerError) {
          console.error('❌ Erro ao criar/enviar offer:', offerError);
          throw offerError;
        } finally {
          makingOfferRef.current = false;
        }
      } else {
        console.log('⏳ Aguardando offer do peer (somos polite)');
        console.log('📊 Estado atual do PeerConnection:', {
          signalingState: pc.signalingState,
          connectionState: pc.connectionState,
          iceConnectionState: pc.iceConnectionState
        });
        
        // Adicionar timeout para detectar se a offer não chega
        setTimeout(() => {
          if (pc.signalingState === 'stable' && !pc.remoteDescription) {
            console.error('❌ PROBLEMA: Esperando offer mas ela não chegou!');
            console.error('📊 Estado atual:', {
              signalingState: pc.signalingState,
              iceConnectionState: pc.iceConnectionState,
              connectionState: pc.connectionState,
              hasRemoteDescription: !!pc.remoteDescription
            });
            console.error('🔍 Possíveis causas:');
            console.error('  1. Peer remoto (impolite) não enviou a offer');
            console.error('  2. Backend não está encaminhando o sinal WebRTC');
            console.error('  3. Subscription /user/queue/webrtc-signal não está funcionando');
            console.error('  4. Match duplicado causou confusão no pareamento');
          }
        }, 8000);
      }
      
      // Timeout de segurança: se após 10 segundos ainda não conectou, forçar conexão
      // se a negociação foi completada (signaling stable)
      const connectionTimeout = setTimeout(() => {
        console.log('⏰ Timeout de segurança: verificando estado da conexão...');
        
        const currentState = {
          callState: callState,
          signalingState: pc.signalingState,
          iceConnectionState: pc.iceConnectionState,
          connectionState: pc.connectionState,
          hasRemoteDescription: !!pc.remoteDescription,
          hasLocalDescription: !!pc.localDescription
        };
        
        console.log('📊 Estado após 10s:', currentState);
        
        // Se a negociação foi completada mas ainda está em 'connecting'
        if (pc.signalingState === 'stable' && pc.remoteDescription && pc.localDescription) {
          console.log('⚠️ Negociação completa mas ainda em connecting - forçando transição');
          setCallState((prevState) => {
            if (prevState === 'connecting') {
              console.log('🔧 Forçando mudança para connected (timeout de segurança)');
              return 'connected';
            }
            return prevState;
          });
        } else {
          console.log('ℹ️ Ainda aguardando negociação completar:', {
            needsOffer: !pc.localDescription && !pc.remoteDescription,
            needsAnswer: !!pc.localDescription && !pc.remoteDescription
          });
        }
      }, 10000);
      
      // Limpar timeout se a conexão for estabelecida
      const cleanupTimeout = () => {
        clearTimeout(connectionTimeout);
      };
      
      // Registrar cleanup
      pc.addEventListener('connectionstatechange', () => {
        if (pc.connectionState === 'connected') {
          cleanupTimeout();
        }
      });
      
      // 🔄 PROCESSAR SINAIS PENDENTES DA FILA
      console.log('🔄 Verificando fila de sinais pendentes:', {
        queueLength: pendingSignalsRef.current.length
      });
      
      if (pendingSignalsRef.current.length > 0) {
        console.log('📋 Processando', pendingSignalsRef.current.length, 'sinais da fila...');
        const pendingSignals = [...pendingSignalsRef.current];
        pendingSignalsRef.current = []; // Limpar fila
        
        for (const signal of pendingSignals) {
          console.log('⚙️ Processando sinal enfileirado:', {
            type: signal.type,
            callId: signal.callId
          });
          await handleWebRTCSignal(signal);
        }
        console.log('✅ Todos os sinais da fila foram processados');
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
        
        // Prevenir match duplicado
        if (peerConnectionRef.current) {
          console.warn('⚠️ Match ignorado: já existe uma PeerConnection ativa');
          return;
        }
        
        // ✅ Usar ref ao invés do state para evitar race condition
        const currentCallIdValue = currentCallId;
        if (currentCallIdValue && currentCallIdValue === data.callId) {
          console.warn('⚠️ Match duplicado ignorado: callId já está ativo');
          return;
        }
        
        console.log('✅ Processando match válido');
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
        console.log('📡 WebRTC Signal recebido via WebSocket:', {
          type: signal.type,
          callId: signal.callId,
          senderId: signal.senderId,
          currentCallId: currentCallId,
          peerId: peerId,
          hasPeerConnection: !!peerConnectionRef.current,
          pendingQueueLength: pendingSignalsRef.current.length,
          timestamp: new Date().toISOString()
        });
        
        // ✅ REMOVIDA validação de callId - aceitar TODOS os sinais
        // A validação será feita dentro de handleWebRTCSignal se necessário
        // Isso evita descartar OFFER que chega antes do currentCallId ser atualizado
        
        await handleWebRTCSignal(signal);
      },
      onChatMessage: (data) => {
        // Obter userId do localStorage
        const currentUserId = getUserId();
        
        // Nova lógica: Se EU SOU o destinatário, exibir a mensagem
        const isMessageForMe = data.recipientId === currentUserId;
        if (!isMessageForMe) {
          // Só ignora se não for pra mim
          return;
        }
        
        // Adicionar a mensagem recebida
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
    // ✅ REMOVER currentCallId e peerId das dependências para evitar re-execução
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!currentCallId || !message.trim()) {
      console.warn('⚠️ Mensagem vazia ou callId inválido - mensagem não enviada');
      console.log('Detalhes:', { message, currentCallId });
      return;
    }
    
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

  // Cleanup completo ao desmontar o provider (logout/troca de usuário)
  useEffect(() => {
    return () => {
      console.log('🧹 CallProvider desmontando - limpando todos os recursos...');
      
      // Parar media streams
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      
      // Fechar peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      // Limpar fila de sinais
      if (pendingSignalsRef.current.length > 0) {
        pendingSignalsRef.current = [];
      }
      
      console.log('✅ Recursos do CallProvider limpos');
    };
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
