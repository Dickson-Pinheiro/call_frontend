import SockJS from 'sockjs-client';
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import type {
  WebRTCSignal,
  MatchFound,
  ChatMessage,
  TypingIndicator,
  StatusMessage,
  CallEnded,
  WebSocketError,
  SendChatMessageRequest,
  SendTypingRequest,
  EndCallRequest,
} from './types/websocket.types';

export type WebSocketEventHandlers = {
  onStatus?: (data: StatusMessage) => void;
  onMatchFound?: (data: MatchFound) => void;
  onWebRTCSignal?: (data: WebRTCSignal) => void;
  onChatMessage?: (data: ChatMessage) => void;
  onTyping?: (data: TypingIndicator) => void;
  onCallEnded?: (data: CallEnded) => void;
  onError?: (data: WebSocketError) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
};

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private eventHandlers: WebSocketEventHandlers = {};
  private isConnecting = false;

  /**
   * Conecta ao WebSocket server com autenticação JWT
   */
  connect(token: string, handlers: WebSocketEventHandlers = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client?.connected) {
        console.log('WebSocket já está conectado');
        resolve();
        return;
      }

      if (this.isConnecting) {
        console.log('Conexão WebSocket já em andamento');
        return;
      }

      this.isConnecting = true;
      this.eventHandlers = handlers;

      console.log('🔐 Conectando WebSocket com token:', token ? 'Token presente' : 'Token ausente');

      // URL do WebSocket a partir de variável de ambiente
      const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';
      console.log('🌐 URL WebSocket:', wsUrl);

      // Criar SockJS socket
      const socket = new SockJS(wsUrl);

      // Criar cliente STOMP
      this.client = new Client({
        webSocketFactory: () => socket as WebSocket,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: (str) => {
          console.log('STOMP Debug:', str);
        },
        reconnectDelay: 1000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.client.onConnect = () => {
        console.log('✅ WebSocket conectado!');
        this.isConnecting = false;
        this.subscribeToTopics();
        this.eventHandlers.onConnect?.();
        resolve();
      };

      // Callback de erro
      this.client.onStompError = (frame) => {
        console.error('❌ Erro STOMP:', frame.headers['message']);
        console.error('Detalhes:', frame.body);
        this.isConnecting = false;
        
        const error: WebSocketError = {
          error: frame.headers['message'] || 'Erro de conexão',
        };
        
        this.eventHandlers.onError?.(error);
        reject(new Error(error.error));
      };

      // Callback de erro do WebSocket (antes do STOMP)
      this.client.onWebSocketError = (event) => {
        console.error('❌ Erro WebSocket (SockJS handshake):', event);
        console.error('💡 Dica: Verifique se o backend Spring Security permite acesso ao endpoint /ws/** sem autenticação');
        console.error('💡 O erro 403 indica que o handshake SockJS está sendo bloqueado antes do STOMP validar o token');
        this.isConnecting = false;
        
        const error: WebSocketError = {
          error: 'Falha no handshake WebSocket. Backend pode estar bloqueando conexão inicial.',
        };
        
        this.eventHandlers.onError?.(error);
        reject(new Error(error.error));
      };

      // Callback de desconexão
      this.client.onDisconnect = () => {
        console.log('🔌 WebSocket desconectado');
        this.eventHandlers.onDisconnect?.();
        this.clearSubscriptions();
      };

      // Callback de erro de WebSocket
      this.client.onWebSocketError = (event) => {
        console.error('❌ Erro WebSocket:', event);
        this.isConnecting = false;
        reject(new Error('Erro de conexão WebSocket'));
      };

      // Ativar cliente
      this.client.activate();
    });
  }

  /**
   * Subscreve a todos os tópicos necessários
   */
  private subscribeToTopics(): void {
    if (!this.client?.connected) {
      console.warn('Cliente não conectado');
      return;
    }

    // Status na fila
    this.subscribe('/user/queue/status', (message) => {
      const data: StatusMessage = JSON.parse(message.body);
      this.eventHandlers.onStatus?.(data);
    });

    // Pareamento encontrado
    this.subscribe('/user/queue/match-found', (message) => {
      const data: MatchFound = JSON.parse(message.body);
      this.eventHandlers.onMatchFound?.(data);
    });

    // Sinais WebRTC
    this.subscribe('/user/queue/webrtc-signal', (message) => {
      const data: WebRTCSignal = JSON.parse(message.body);
      this.eventHandlers.onWebRTCSignal?.(data);
    });

    // Mensagens de chat
    this.subscribe('/user/queue/chat', (message) => {
      const data: ChatMessage = JSON.parse(message.body);
      this.eventHandlers.onChatMessage?.(data);
    });

    // Indicador de digitação
    this.subscribe('/user/queue/typing', (message) => {
      const data: TypingIndicator = JSON.parse(message.body);
      this.eventHandlers.onTyping?.(data);
    });

    // Chamada encerrada
    this.subscribe('/user/queue/call-ended', (message) => {
      const data: CallEnded = JSON.parse(message.body);
      this.eventHandlers.onCallEnded?.(data);
    });

    // Erros
    this.subscribe('/user/queue/error', (message) => {
      const data: WebSocketError = JSON.parse(message.body);
      this.eventHandlers.onError?.(data);
    });
  }

  /**
   * Helper para subscrição
   */
  private subscribe(destination: string, callback: (message: IMessage) => void): void {
    if (!this.client?.connected) return;

    const subscription = this.client.subscribe(destination, callback);
    this.subscriptions.set(destination, subscription);
    console.log(`📡 Subscrito a: ${destination}`);
  }

  /**
   * Limpa todas as subscrições
   */
  private clearSubscriptions(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }

  /**
   * Atualiza os event handlers dinamicamente
   */
  updateHandlers(handlers: Partial<WebSocketEventHandlers>): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  // ============================================================================
  // MÉTODOS PARA ENVIAR MENSAGENS
  // ============================================================================

  /**
   * Entrar na fila de pareamento
   */
  joinQueue(): void {
    this.send('/app/join-queue', {});
  }

  /**
   * Sair da fila
   */
  leaveQueue(): void {
    this.send('/app/leave-queue', {});
  }

  /**
   * Próxima pessoa (Skip)
   */
  nextPerson(): void {
    this.send('/app/next-person', {});
  }

  /**
   * Encerrar chamada
   */
  endCall(request: EndCallRequest): void {
    this.send('/app/end-call', request);
  }

  /**
   * Enviar sinal WebRTC
   */
  sendWebRTCSignal(signal: WebRTCSignal): void {
    this.send('/app/webrtc-signal', signal);
  }

  /**
   * Enviar mensagem de chat
   */
  sendChatMessage(request: SendChatMessageRequest): void {
    this.send('/app/chat-message', request);
  }

  /**
   * Enviar indicador de digitação
   */
  sendTyping(request: SendTypingRequest): void {
    this.send('/app/typing', request);
  }

  /**
   * Helper genérico para enviar mensagens
   */
  private send(destination: string, body: unknown): void {
    if (!this.client?.connected) {
      console.error('❌ Não conectado. Não é possível enviar mensagem.');
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }

  /**
   * Desconectar do WebSocket
   */
  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.client) {
        resolve();
        return;
      }

      this.clearSubscriptions();
      this.client.deactivate();
      this.client = null;
      console.log('🔌 WebSocket desconectado manualmente');
      resolve();
    });
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  /**
   * Obtém o cliente STOMP (para casos avançados)
   */
  getClient(): Client | null {
    return this.client;
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();
