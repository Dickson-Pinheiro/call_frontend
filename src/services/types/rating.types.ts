export interface Rating {
  id: number;
  callId: number;
  raterId: number;
  raterName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface CreateRatingRequest {
  callId: number;
  raterId: number;
  rating: number;
  comment?: string;
}

export interface UpdateRatingRequest {
  rating: number;
  comment?: string;
}
