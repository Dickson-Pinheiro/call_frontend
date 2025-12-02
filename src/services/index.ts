export { default as api, setToken, removeToken, getUserId, setUserId, removeUserId } from './api';
export { authService } from './authService';
export { callService } from './callService';
export { ratingService } from './ratingService';
export { webSocketService } from './websocketService';

export { useSignup, useLogin, useLogout } from './hooks/useAuth';
export { 
  useCalls,
  useCallsByStatus,
  useActiveCalls,
  useCompletedCalls,
  useCall,
  useCreateCall,
  useEndCall,
  useCancelCall,
  useUpdateCallType,
  useDeleteCall,
  callKeys,
} from './hooks/useCalls';
export {
  useRating,
  useRatings,
  useRatingsByMinRating,
  useTopRatings,
  usePositiveRatings,
  useCreateRating,
  useUpdateRating,
  useDeleteRating,
  ratingKeys,
} from './hooks/useRatings';
export { useWebSocket } from './hooks/useWebSocket';

export type { 
  SignupRequest, 
  LoginRequest, 
  AuthResponse, 
  User 
} from './types/auth.types';

export type {
  Call,
  CallStatus,
  CallType,
  CreateCallRequest,
  UpdateCallTypeRequest,
} from './types/call.types';

export type {
  Rating,
  CreateRatingRequest,
  UpdateRatingRequest,
} from './types/rating.types';

export type {
  WebRTCSignal,
  WebRTCSignalType,
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

export type { WebSocketEventHandlers } from './websocketService';
