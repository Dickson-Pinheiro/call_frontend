import { api } from './api';
import type { Call, CreateCallRequest, UpdateCallTypeRequest, CallStatus } from './types/call.types';

/**
 * Serviço para gerenciar chamadas
 * Factory pattern - retorna objeto com métodos
 */
export const callService = () => ({
  /**
   * Lista todas as chamadas do usuário autenticado
   */
  getAllCalls: async (): Promise<Call[]> => {
    const { data } = await api.get<Call[]>('/api/calls');
    return data;
  },

  /**
   * Lista chamadas por status
   */
  getCallsByStatus: async (status: CallStatus): Promise<Call[]> => {
    const { data } = await api.get<Call[]>(`/api/calls/status/${status}`);
    return data;
  },

  /**
   * Lista apenas chamadas ativas
   */
  getActiveCalls: async (): Promise<Call[]> => {
    const { data } = await api.get<Call[]>('/api/calls/active');
    return data;
  },

  /**
   * Lista apenas chamadas concluídas (histórico)
   */
  getCompletedCalls: async (): Promise<Call[]> => {
    const { data } = await api.get<Call[]>('/api/calls/completed');
    return data;
  },

  /**
   * Obter chamada específica por ID
   */
  getCallById: async (id: number): Promise<Call> => {
    const { data } = await api.get<Call>(`/api/calls/${id}`);
    return data;
  },

  /**
   * Criar nova chamada
   */
  createCall: async (request: CreateCallRequest): Promise<Call> => {
    const { data } = await api.post<Call>('/api/calls', request);
    return data;
  },

  /**
   * Encerrar chamada ativa
   */
  endCall: async (id: number): Promise<Call> => {
    const { data } = await api.post<Call>(`/api/calls/${id}/end`);
    return data;
  },

  /**
   * Cancelar chamada
   */
  cancelCall: async (id: number): Promise<Call> => {
    const { data } = await api.post<Call>(`/api/calls/${id}/cancel`);
    return data;
  },

  /**
   * Atualizar tipo de chamada (VIDEO/AUDIO)
   */
  updateCallType: async (id: number, request: UpdateCallTypeRequest): Promise<Call> => {
    const { data } = await api.patch<Call>(`/api/calls/${id}/type`, request);
    return data;
  },

  /**
   * Deletar chamada
   */
  deleteCall: async (id: number): Promise<void> => {
    await api.delete(`/api/calls/${id}`);
  },
});
