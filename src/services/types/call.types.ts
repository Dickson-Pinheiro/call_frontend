export type CallStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type CallType = 'VIDEO' | 'AUDIO';

export interface Call {
  id: number;
  user1Id: number;
  user1Name: string;
  user2Id: number;
  user2Name: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  callType: CallType;
  status: CallStatus;
}

export interface CreateCallRequest {
  user2Id: number;
  callType: CallType;
}

export interface UpdateCallTypeRequest {
  callType: CallType;
}
