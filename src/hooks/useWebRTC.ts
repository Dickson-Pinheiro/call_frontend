import { useState, useRef, useCallback } from 'react';
import { type WebRTCSignal, getUserId } from '@/services';

export type CallState = 'idle' | 'searching' | 'connecting' | 'connected' | 'ended';

interface UseWebRTCProps {
    currentCallId: number | null;
    peerId: number | null;
    sendWebRTCSignal: (signal: any) => void;
    onCallStateChange: (state: CallState | ((prev: CallState) => CallState)) => void;
    navigate?: (to: any) => void;
}

export function useWebRTC({
    currentCallId,
    peerId,
    sendWebRTCSignal,
    onCallStateChange,
    navigate
}: UseWebRTCProps) {
    // State
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    // Refs
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const makingOfferRef = useRef(false);
    const ignoreOfferRef = useRef(false);
    const pendingSignalsRef = useRef<WebRTCSignal[]>([]);

    // Configuração ICE servers
    const rtcConfig: RTCConfiguration = {
        iceServers: [
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

    const cleanupWebRTC = useCallback(() => {
        console.log('🧹 Limpando recursos WebRTC');

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }

        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (pendingSignalsRef.current.length > 0) {
            console.log('🗑️ Descartando', pendingSignalsRef.current.length, 'sinais pendentes');
            pendingSignalsRef.current = [];
        }

        setLocalStream(null);
        setRemoteStream(null);
        setIsVideoEnabled(true);
        setIsAudioEnabled(true);
    }, []);

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
            pendingSignalsRef.current.push(signal);
            return;
        }

        try {
            if (signal.type === 'offer') {
                const offerCollision = (signal.type === 'offer') &&
                    (makingOfferRef.current || pc.signalingState !== 'stable');

                const currentUserId = getUserId();
                const isPolite = currentUserId !== null && peerId !== null && currentUserId < peerId;

                ignoreOfferRef.current = !isPolite && offerCollision;
                if (ignoreOfferRef.current) {
                    console.log('⚠️ Ignorando offer (collision, somos impolite)');
                    return;
                }

                await pc.setRemoteDescription(new RTCSessionDescription(signal.data as RTCSessionDescriptionInit));

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                sendWebRTCSignal({
                    type: 'answer',
                    callId: currentCallId!,
                    targetUserId: peerId!,
                    data: answer,
                });
            } else if (signal.type === 'answer') {
                if (pc.signalingState !== 'have-local-offer') {
                    console.warn('⚠️ Ignorando answer - não estamos esperando');
                    return;
                }
                await pc.setRemoteDescription(new RTCSessionDescription(signal.data as RTCSessionDescriptionInit));
            } else if (signal.type === 'ice-candidate') {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(signal.data as RTCIceCandidateInit));
                } catch (err) {
                    if (!ignoreOfferRef.current) {
                        console.error('❌ Erro ao adicionar ICE candidate:', err);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Erro ao processar sinal WebRTC:', error);
        }
    }, [sendWebRTCSignal, currentCallId, peerId]);

    const initializeWebRTC = useCallback(async (callId: number, targetPeerId: number) => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Seu navegador não suporta acesso à câmera/microfone.');
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

            localStreamRef.current = stream;
            setLocalStream(stream);

            const pc = new RTCPeerConnection(rtcConfig);
            peerConnectionRef.current = pc;

            stream.getTracks().forEach((track) => pc.addTrack(track, stream));

            pc.ontrack = (event) => {
                if (event.streams && event.streams[0]) {
                    setRemoteStream(event.streams[0]);
                    onCallStateChange('connected');
                }
            };

            pc.onsignalingstatechange = () => {
                if (pc.signalingState === 'stable' && pc.remoteDescription) {
                    // Lógica de verificação de conexão
                    setTimeout(() => {
                        const currentIceState = pc.iceConnectionState;
                        if (currentIceState === 'checking' || currentIceState === 'connected' || currentIceState === 'completed') {
                            onCallStateChange(prev => prev === 'connecting' ? 'connected' : prev);
                        }
                    }, 1000);
                }
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    sendWebRTCSignal({
                        type: 'ice-candidate',
                        callId,
                        targetUserId: targetPeerId,
                        data: event.candidate.toJSON(),
                    });
                }
            };

            pc.oniceconnectionstatechange = () => {
                const state = pc.iceConnectionState;
                if (state === 'connected' || state === 'completed') {
                    onCallStateChange(prev => prev !== 'connected' ? 'connected' : prev);
                } else if (state === 'failed') {
                    pc.restartIce();
                }
            };

            pc.onconnectionstatechange = () => {
                if (pc.connectionState === 'connected') {
                    onCallStateChange(prev => prev !== 'connected' ? 'connected' : prev);
                } else if (pc.connectionState === 'failed') {
                    // Lógica de tratamento de falha de conexão
                    setTimeout(() => {
                        if (pc.connectionState === 'failed') {
                            // alert ou tratamento de erro
                        }
                    }, 3000);
                }
            };

            // Negociação
            const currentUserId = getUserId();
            const shouldCreateOffer = currentUserId !== null && currentUserId > targetPeerId;

            if (shouldCreateOffer) {
                makingOfferRef.current = true;
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);

                    sendWebRTCSignal({
                        type: 'offer',
                        callId,
                        targetUserId: targetPeerId,
                        data: offer,
                    });
                } catch (err) {
                    console.error(err);
                } finally {
                    makingOfferRef.current = false;
                }
            }

            // Processar sinais pendentes
            if (pendingSignalsRef.current.length > 0) {
                const pendingSignals = [...pendingSignalsRef.current];
                pendingSignalsRef.current = [];
                for (const signal of pendingSignals) {
                    await handleWebRTCSignal(signal);
                }
            }

        } catch (error) {
            console.error('❌ Erro ao inicializar WebRTC:', error);
            cleanupWebRTC();
            if (navigate) navigate({ to: '/app/dashboard' });
            // throw error; // Opcional: deixar quem chamou tratar
        }
    }, [sendWebRTCSignal, cleanupWebRTC, handleWebRTCSignal, onCallStateChange, navigate]);

    const toggleVideo = useCallback(() => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        }
    }, []);

    const toggleAudio = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
            }
        }
    }, []);

    return {
        localStream,
        remoteStream,
        isVideoEnabled,
        isAudioEnabled,
        initializeWebRTC,
        handleWebRTCSignal,
        cleanupWebRTC,
        toggleVideo,
        toggleAudio
    };
}
