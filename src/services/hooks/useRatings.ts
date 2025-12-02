import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ratingService } from '../ratingService';
import type { CreateRatingRequest, UpdateRatingRequest } from '../types/rating.types';

const service = ratingService();

// Query keys para gerenciar cache
export const ratingKeys = {
  all: ['ratings'] as const,
  lists: () => [...ratingKeys.all, 'list'] as const,
  list: (filters?: string) => [...ratingKeys.lists(), { filters }] as const,
  details: () => [...ratingKeys.all, 'detail'] as const,
  detail: (id: number) => [...ratingKeys.details(), id] as const,
  top: () => [...ratingKeys.all, 'top'] as const,
  positive: () => [...ratingKeys.all, 'positive'] as const,
  minRating: (rating: number) => [...ratingKeys.all, 'minRating', rating] as const,
};

/**
 * Hook para obter avaliação por ID
 */
export const useRating = (id: number) => {
  return useQuery({
    queryKey: ratingKeys.detail(id),
    queryFn: () => service.getRatingById(id),
    enabled: !!id,
  });
};

/**
 * Hook para listar todas as avaliações
 */
export const useRatings = () => {
  return useQuery({
    queryKey: ratingKeys.lists(),
    queryFn: () => service.getAllRatings(),
  });
};

/**
 * Hook para listar avaliações por nota mínima
 */
export const useRatingsByMinRating = (minRating: number) => {
  return useQuery({
    queryKey: ratingKeys.minRating(minRating),
    queryFn: () => service.getRatingsByMinRating(minRating),
    enabled: minRating >= 1 && minRating <= 5,
  });
};

/**
 * Hook para listar melhores avaliações
 */
export const useTopRatings = () => {
  return useQuery({
    queryKey: ratingKeys.top(),
    queryFn: () => service.getTopRatings(),
  });
};

/**
 * Hook para listar avaliações positivas
 */
export const usePositiveRatings = () => {
  return useQuery({
    queryKey: ratingKeys.positive(),
    queryFn: () => service.getPositiveRatings(),
  });
};

/**
 * Hook para criar avaliação
 */
export const useCreateRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRatingRequest) => service.createRating(data),
    onSuccess: () => {
      // Invalidar cache de ratings e chamadas
      queryClient.invalidateQueries({ queryKey: ratingKeys.all });
      queryClient.invalidateQueries({ queryKey: ['calls'] });
    },
  });
};

/**
 * Hook para atualizar avaliação
 */
export const useUpdateRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRatingRequest }) =>
      service.updateRating(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ratingKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ratingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ratingKeys.top() });
      queryClient.invalidateQueries({ queryKey: ratingKeys.positive() });
    },
  });
};

/**
 * Hook para deletar avaliação
 */
export const useDeleteRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => service.deleteRating(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ratingKeys.all });
    },
  });
};
