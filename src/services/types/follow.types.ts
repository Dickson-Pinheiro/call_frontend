export interface FollowResponse {
  success: boolean;
  message: string;
  followerId: number;
  followingId: number;
}

export interface UserStatsResponse {
  userId: number;
  name: string;
  followingCount: number;
  followersCount: number;
  isFollowing: boolean;
}

export interface IsFollowingResponse {
  isFollowing: boolean;
}

export interface FollowingUser {
  id: number;
  name: string;
  email: string;
}

export interface FollowerUser {
  id: number;
  name: string;
  email: string;
}
