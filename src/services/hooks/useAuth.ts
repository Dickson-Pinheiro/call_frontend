import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { authService } from '../authService';
import { webSocketService } from '../websocketService';
import type { SignupRequest, LoginRequest, AuthResponse } from '../types/auth.types';

type UseSignupOptions = Omit<
  UseMutationOptions<AuthResponse, Error, SignupRequest>,
  'mutationFn'
>;

type UseLoginOptions = Omit<
  UseMutationOptions<AuthResponse, Error, LoginRequest>,
  'mutationFn'
>;

type UseLogoutOptions = Omit<
  UseMutationOptions<void, Error>,
  'mutationFn'
>;

export const useSignup = (options?: UseSignupOptions) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const defaultOnSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['user'] });
    navigate({ to: '/app/dashboard' });
  };

  return useMutation<AuthResponse, Error, SignupRequest>({
    mutationFn: authService().signup,
    ...options,
    onSuccess: options?.onSuccess || defaultOnSuccess,
  });
};

export const useLogin = (options?: UseLoginOptions) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const defaultOnSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['user'] });
    navigate({ to: '/app/dashboard' });
  };

  return useMutation<AuthResponse, Error, LoginRequest>({
    mutationFn: authService().login,
    ...options,
    onSuccess: options?.onSuccess || defaultOnSuccess,
  });
};

export const useLogout = (options?: UseLogoutOptions) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const defaultOnSuccess = async () => {
    // 1. Limpar cache do React Query
    queryClient.clear();
    
    // 2. Desconectar WebSocket ANTES de limpar localStorage
    console.log('🔌 Desconectando WebSocket no logout...');
    try {
      await webSocketService.disconnect();
      console.log('✅ WebSocket desconectado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao desconectar WebSocket:', error);
    }
    
    // 3. Limpar localStorage (incluindo token)
    localStorage.clear();
    
    // 4. Redirecionar para login
    navigate({ to: '/' });
  };

  return useMutation<void, Error>({
    mutationFn: authService().logout,
    ...options,
    onSuccess: options?.onSuccess || defaultOnSuccess,
  });
};
