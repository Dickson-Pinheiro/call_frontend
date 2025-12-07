import { api } from './api';
import type {
  FollowResponse,
  UserStatsResponse,
  IsFollowingResponse,
  FollowingUser,
  FollowerUser,
} from './types/follow.types';

export const followService = () => ({
  /**
   * Seguir um usuário
   * POST /api/follows/{followingId}?userId={userId}
   */
  follow: async (followingId: number, userId: number): Promise<FollowResponse> => {
    const response = await api.post(`/api/follows/${followingId}`, null, {
      params: { userId },
    });
    return response.data;
  },

  /**
   * Deixar de seguir um usuário
   * DELETE /api/follows/{followingId}?userId={userId}
   */
  unfollow: async (followingId: number, userId: number): Promise<FollowResponse> => {
    const response = await api.delete(`/api/follows/${followingId}`, {
      params: { userId },
    });
    return response.data;
  },

  /**
   * Listar quem o usuário está seguindo
   * GET /api/follows/{userId}/following
   */
  getFollowing: async (userId: number): Promise<FollowingUser[]> => {
    const response = await api.get(`/api/follows/${userId}/following`);
    return response.data;
  },

  /**
   * Listar seguidores do usuário
   * GET /api/follows/{userId}/followers
   */
  getFollowers: async (userId: number): Promise<FollowerUser[]> => {
    const response = await api.get(`/api/follows/${userId}/followers`);
    return response.data;
  },

  /**
   * Obter estatísticas do usuário (com isFollowing)
   * GET /api/follows/{userId}/stats?currentUserId={currentUserId}
   */
  getUserStats: async (userId: number, currentUserId: number): Promise<UserStatsResponse> => {
    const response = await api.get(`/api/follows/${userId}/stats`, {
      params: { currentUserId },
    });
    return response.data;
  },

  /**
   * Verificar se um usuário está seguindo outro
   * GET /api/follows/check?followerId={followerId}&followingId={followingId}
   */
  isFollowing: async (followerId: number, followingId: number): Promise<IsFollowingResponse> => {
    const response = await api.get('/api/follows/check', {
      params: { followerId, followingId },
    });
    return response.data;
  },
});
