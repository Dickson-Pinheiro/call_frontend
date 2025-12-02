import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import { callService } from '../callService';
import type { Call, CreateCallRequest, UpdateCallTypeRequest, CallStatus } from '../types/call.types';

// Query Keys
export const callKeys = {
  all: ['calls'] as const,
  lists: () => [...callKeys.all, 'list'] as const,
  list: (filters?: string) => [...callKeys.lists(), { filters }] as const,
  details: () => [...callKeys.all, 'detail'] as const,
  detail: (id: number) => [...callKeys.details(), id] as const,
  byStatus: (status: CallStatus) => [...callKeys.all, 'status', status] as const,
  active: () => [...callKeys.all, 'active'] as const,
  completed: () => [...callKeys.all, 'completed'] as const,
};

// ============================================================================
// QUERIES (READ)
// ============================================================================

type UseCallsOptions = Omit<
  UseQueryOptions<Call[], Error>,
  'queryKey' | 'queryFn'
>;

/**
 * Hook para listar todas as chamadas do usuário
 */
export const useCalls = (options?: UseCallsOptions) => {
  return useQuery<Call[], Error>({
    queryKey: callKeys.lists(),
    queryFn: callService().getAllCalls,
    ...options,
  });
};

/**
 * Hook para listar chamadas por status
 */
export const useCallsByStatus = (status: CallStatus, options?: UseCallsOptions) => {
  return useQuery<Call[], Error>({
    queryKey: callKeys.byStatus(status),
    queryFn: () => callService().getCallsByStatus(status),
    ...options,
  });
};

/**
 * Hook para listar chamadas ativas
 */
export const useActiveCalls = (options?: UseCallsOptions) => {
  return useQuery<Call[], Error>({
    queryKey: callKeys.active(),
    queryFn: callService().getActiveCalls,
    ...options,
  });
};

/**
 * Hook para listar chamadas concluídas (histórico)
 */
export const useCompletedCalls = (options?: UseCallsOptions) => {
  return useQuery<Call[], Error>({
    queryKey: callKeys.completed(),
    queryFn: callService().getCompletedCalls,
    ...options,
  });
};

type UseCallOptions = Omit<
  UseQueryOptions<Call, Error>,
  'queryKey' | 'queryFn'
>;

/**
 * Hook para obter uma chamada específica por ID
 */
export const useCall = (id: number, options?: UseCallOptions) => {
  return useQuery<Call, Error>({
    queryKey: callKeys.detail(id),
    queryFn: () => callService().getCallById(id),
    enabled: !!id,
    ...options,
  });
};

// ============================================================================
// MUTATIONS (CREATE, UPDATE, DELETE)
// ============================================================================

type UseCreateCallOptions = Omit<
  UseMutationOptions<Call, Error, CreateCallRequest>,
  'mutationFn' | 'onSuccess'
>;

/**
 * Hook para criar nova chamada
 */
export const useCreateCall = (options?: UseCreateCallOptions) => {
  const queryClient = useQueryClient();

  return useMutation<Call, Error, CreateCallRequest>({
    mutationFn: callService().createCall,
    onSuccess: () => {
      // Invalida todas as listas de chamadas
      queryClient.invalidateQueries({ queryKey: callKeys.lists() });
      queryClient.invalidateQueries({ queryKey: callKeys.active() });
    },
    ...options,
  });
};

type UseEndCallOptions = Omit<
  UseMutationOptions<Call, Error, number>,
  'mutationFn' | 'onSuccess'
>;

/**
 * Hook para encerrar uma chamada
 */
export const useEndCall = (options?: UseEndCallOptions) => {
  const queryClient = useQueryClient();

  return useMutation<Call, Error, number>({
    mutationFn: callService().endCall,
    onSuccess: (_data, variables) => {
      // Invalida listas e o detalhe da chamada
      queryClient.invalidateQueries({ queryKey: callKeys.lists() });
      queryClient.invalidateQueries({ queryKey: callKeys.active() });
      queryClient.invalidateQueries({ queryKey: callKeys.completed() });
      queryClient.invalidateQueries({ queryKey: callKeys.detail(variables) });
    },
    ...options,
  });
};

type UseCancelCallOptions = Omit<
  UseMutationOptions<Call, Error, number>,
  'mutationFn' | 'onSuccess'
>;

/**
 * Hook para cancelar uma chamada
 */
export const useCancelCall = (options?: UseCancelCallOptions) => {
  const queryClient = useQueryClient();

  return useMutation<Call, Error, number>({
    mutationFn: callService().cancelCall,
    onSuccess: (_data, variables) => {
      // Invalida listas e o detalhe da chamada
      queryClient.invalidateQueries({ queryKey: callKeys.lists() });
      queryClient.invalidateQueries({ queryKey: callKeys.active() });
      queryClient.invalidateQueries({ queryKey: callKeys.detail(variables) });
    },
    ...options,
  });
};

type UpdateCallTypeVariables = {
  id: number;
  request: UpdateCallTypeRequest;
};

type UseUpdateCallTypeOptions = Omit<
  UseMutationOptions<Call, Error, UpdateCallTypeVariables>,
  'mutationFn' | 'onSuccess'
>;

/**
 * Hook para atualizar tipo de chamada (VIDEO/AUDIO)
 */
export const useUpdateCallType = (options?: UseUpdateCallTypeOptions) => {
  const queryClient = useQueryClient();

  return useMutation<Call, Error, UpdateCallTypeVariables>({
    mutationFn: ({ id, request }) => callService().updateCallType(id, request),
    onSuccess: (_data, variables) => {
      // Invalida listas e o detalhe da chamada
      queryClient.invalidateQueries({ queryKey: callKeys.lists() });
      queryClient.invalidateQueries({ queryKey: callKeys.detail(variables.id) });
    },
    ...options,
  });
};

type UseDeleteCallOptions = Omit<
  UseMutationOptions<void, Error, number>,
  'mutationFn' | 'onSuccess'
>;

/**
 * Hook para deletar uma chamada
 */
export const useDeleteCall = (options?: UseDeleteCallOptions) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: callService().deleteCall,
    onSuccess: () => {
      // Invalida todas as listas
      queryClient.invalidateQueries({ queryKey: callKeys.all });
    },
    ...options,
  });
};
