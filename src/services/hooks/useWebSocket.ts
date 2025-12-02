import { useEffect, useRef, useCallback } from 'react';
import { webSocketService, type WebSocketEventHandlers } from '../websocketService';
import type { WebRTCSignal } from '../types/websocket.types';

interface UseWebSocketOptions {
  /**
   * Auto-conectar ao montar o componente
   */
  autoConnect?: boolean;
  
  /**
   * Auto-desconectar ao desmontar o componente
   */
  autoDisconnect?: boolean;
  
  /**
   * Event handlers para eventos WebSocket
   */
  handlers?: WebSocketEventHandlers;
}

interface UseWebSocketReturn {
  /**
   * Conectar ao WebSocket
   */
  connect: () => Promise<void>;
  
  /**
   * Desconectar do WebSocket
   */
  disconnect: () => Promise<void>;
  
  /**
   * Verificar se está conectado
   */
  isConnected: () => boolean;
  
  /**
   * Entrar na fila de pareamento
   */
  joinQueue: () => void;
  
  /**
   * Sair da fila
   */
  leaveQueue: () => void;
  
  /**
   * Próxima pessoa (Skip)
   */
  nextPerson: () => void;
  
  /**
   * Encerrar chamada
   */
  endCall: (callId: number) => void;
  
  /**
   * Enviar sinal WebRTC
   */
  sendWebRTCSignal: (signal: WebRTCSignal) => void;
  
  /**
   * Enviar mensagem de chat
   */
  sendChatMessage: (callId: number, message: string) => void;
  
  /**
   * Enviar indicador de digitação
   */
  sendTyping: (callId: number) => void;
  
  /**
   * Atualizar handlers dinamicamente
   */
  updateHandlers: (handlers: Partial<WebSocketEventHandlers>) => void;
}

/**
 * Hook para gerenciar conexão WebSocket
 */
export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const {
    autoConnect = false,
    autoDisconnect = true,
    handlers = {},
  } = options;

  const handlersRef = useRef(handlers);
  const hasConnectedRef = useRef(false);

  // Atualizar ref quando handlers mudam
  useEffect(() => {
    handlersRef.current = handlers;
    if (webSocketService.isConnected()) {
      webSocketService.updateHandlers(handlers);
    }
  }, [handlers]);

  // Conectar
  const connect = useCallback(async () => {
    if (webSocketService.isConnected()) {
      console.log('Já conectado ao WebSocket');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    try {
      await webSocketService.connect(token, handlersRef.current);
      hasConnectedRef.current = true;
    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
      throw error;
    }
  }, []);

  // Desconectar
  const disconnect = useCallback(async () => {
    try {
      await webSocketService.disconnect();
      hasConnectedRef.current = false;
    } catch (error) {
      console.error('Erro ao desconectar WebSocket:', error);
      throw error;
    }
  }, []);

  // Métodos do serviço
  const joinQueue = useCallback(() => {
    webSocketService.joinQueue();
  }, []);

  const leaveQueue = useCallback(() => {
    webSocketService.leaveQueue();
  }, []);

  const nextPerson = useCallback(() => {
    webSocketService.nextPerson();
  }, []);

  const endCall = useCallback((callId: number) => {
    webSocketService.endCall({ callId });
  }, []);

  const sendWebRTCSignal = useCallback((signal: WebRTCSignal) => {
    webSocketService.sendWebRTCSignal(signal);
  }, []);

  const sendChatMessage = useCallback((callId: number, message: string) => {
    webSocketService.sendChatMessage({ callId, message });
  }, []);

  const sendTyping = useCallback((callId: number) => {
    webSocketService.sendTyping({ callId });
  }, []);

  const isConnected = useCallback(() => {
    return webSocketService.isConnected();
  }, []);

  const updateHandlers = useCallback((newHandlers: Partial<WebSocketEventHandlers>) => {
    handlersRef.current = { ...handlersRef.current, ...newHandlers };
    webSocketService.updateHandlers(newHandlers);
  }, []);

  // Auto-conectar ao montar
  useEffect(() => {
    if (autoConnect && !hasConnectedRef.current) {
      connect().catch(console.error);
    }

    // Auto-desconectar ao desmontar
    return () => {
      if (autoDisconnect && hasConnectedRef.current) {
        disconnect().catch(console.error);
      }
    };
  }, [autoConnect, autoDisconnect, connect, disconnect]);

  return {
    connect,
    disconnect,
    isConnected,
    joinQueue,
    leaveQueue,
    nextPerson,
    endCall,
    sendWebRTCSignal,
    sendChatMessage,
    sendTyping,
    updateHandlers,
  };
};
