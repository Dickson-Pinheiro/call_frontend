import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { treeService } from '../treeService';
import type { AllTreesResponse, TreeStructure, TreeType } from '../types/tree.types';

export const treeKeys = {
  all: ['trees'] as const,
  allTrees: () => [...treeKeys.all, 'all'] as const,
  byType: (type: TreeType) => [...treeKeys.all, type] as const,
};

type UseTreesOptions = Omit<
  UseQueryOptions<AllTreesResponse, Error>,
  'queryKey' | 'queryFn'
>;

type UseTreeByTypeOptions = Omit<
  UseQueryOptions<TreeStructure, Error>,
  'queryKey' | 'queryFn'
>;

/**
 * Hook para buscar todas as árvores
 */
export const useAllTrees = (options?: UseTreesOptions) => {
  return useQuery<AllTreesResponse, Error>({
    queryKey: treeKeys.allTrees(),
    queryFn: treeService().getAllTrees,
    staleTime: 1000 * 60, // 1 minuto
    ...options,
  });
};

/**
 * Hook para buscar uma árvore específica
 */
export const useTreeByType = (type: TreeType, options?: UseTreeByTypeOptions) => {
  return useQuery<TreeStructure, Error>({
    queryKey: treeKeys.byType(type),
    queryFn: () => treeService().getTreeByType(type),
    staleTime: 1000 * 60, // 1 minuto
    ...options,
  });
};
