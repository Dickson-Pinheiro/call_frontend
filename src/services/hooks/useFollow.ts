import { useMutation, useQuery, useQueryClient, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import { followService } from '../followService';
import type {
  FollowResponse,
  UserStatsResponse,
  IsFollowingResponse,
  FollowingUser,
  FollowerUser,
} from '../types/follow.types';

// Hook para seguir usuário
export const useFollow = (
  options?: Omit<UseMutationOptions<FollowResponse, Error, { followingId: number; userId: number }>, 'mutationFn'>
) => {
  const queryClient = useQueryClient();

  return useMutation<FollowResponse, Error, { followingId: number; userId: number }>({
    mutationFn: ({ followingId, userId }) => followService().follow(followingId, userId),
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['following', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['followers', variables.followingId] });
      queryClient.invalidateQueries({ queryKey: ['userStats', variables.followingId] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
    },
    ...options,
  });
};

// Hook para deixar de seguir
export const useUnfollow = (
  options?: Omit<UseMutationOptions<FollowResponse, Error, { followingId: number; userId: number }>, 'mutationFn'>
) => {
  const queryClient = useQueryClient();

  return useMutation<FollowResponse, Error, { followingId: number; userId: number }>({
    mutationFn: ({ followingId, userId }) => followService().unfollow(followingId, userId),
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['following', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['followers', variables.followingId] });
      queryClient.invalidateQueries({ queryKey: ['userStats', variables.followingId] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
    },
    ...options,
  });
};

// Hook para listar quem o usuário está seguindo
export const useFollowing = (
  userId: number,
  options?: Omit<UseQueryOptions<FollowingUser[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<FollowingUser[], Error>({
    queryKey: ['following', userId],
    queryFn: () => followService().getFollowing(userId),
    enabled: !!userId,
    ...options,
  });
};

// Hook para listar seguidores
export const useFollowers = (
  userId: number,
  options?: Omit<UseQueryOptions<FollowerUser[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<FollowerUser[], Error>({
    queryKey: ['followers', userId],
    queryFn: () => followService().getFollowers(userId),
    enabled: !!userId,
    ...options,
  });
};

// Hook para obter estatísticas do usuário
export const useUserStats = (
  userId: number,
  currentUserId: number,
  options?: Omit<UseQueryOptions<UserStatsResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<UserStatsResponse, Error>({
    queryKey: ['userStats', userId, currentUserId],
    queryFn: () => followService().getUserStats(userId, currentUserId),
    enabled: !!userId && !!currentUserId,
    ...options,
  });
};

// Hook para verificar se está seguindo
export const useIsFollowing = (
  followerId: number,
  followingId: number,
  options?: Omit<UseQueryOptions<IsFollowingResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<IsFollowingResponse, Error>({
    queryKey: ['isFollowing', followerId, followingId],
    queryFn: () => followService().isFollowing(followerId, followingId),
    enabled: !!followerId && !!followingId,
    ...options,
  });
};
