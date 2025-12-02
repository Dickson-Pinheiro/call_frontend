export type WebRTCSignalType = 'offer' | 'answer' | 'ice-candidate';

export interface WebRTCSignal {
  type: WebRTCSignalType;
  callId: number;
  targetUserId: number;
  senderId?: number;
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

export interface MatchFound {
  callId: number;
  peerId: number;
  peerName: string;
}

export interface ChatMessage {
  id: number;
  callId: number;
  senderId: number;
  senderName: string;
  message: string;
  sentAt: string;
}

export interface TypingIndicator {
  callId: number;
  userId: number;
  isTyping: boolean;
}

export interface StatusMessage {
  message: string;
  status?: string;
}

export interface CallEnded {
  callId: number;
  reason?: string;
}

export interface WebSocketError {
  error: string;
  code?: string;
}

export interface SendChatMessageRequest {
  callId: number;
  message: string;
}

export interface SendTypingRequest {
  callId: number;
}

export interface EndCallRequest {
  callId: number;
}
