import api, { setToken, removeToken } from './api';
import type { SignupRequest, LoginRequest, AuthResponse } from './types/auth.types';

export const authService = () => {
  return {
    /**
     * Cadastro de novo usuário
     * POST /api/auth/signup
     */
    signup: async (data: SignupRequest): Promise<AuthResponse> => {
      const response = await api.post<AuthResponse>('/api/auth/signup', data);
      
      // Salva o token automaticamente após o cadastro
      if (response.data.token) {
        setToken(response.data.token);
      }
      
      return response.data;
    },

    /**
     * Login de usuário
     * POST /api/auth/login
     */
    login: async (data: LoginRequest): Promise<AuthResponse> => {
      const response = await api.post<AuthResponse>('/api/auth/login', data);
      
      // Salva o token automaticamente após o login
      if (response.data.token) {
        setToken(response.data.token);
      }
      
      return response.data;
    },

    /**
     * Logout de usuário
     * POST /api/auth/logout
     */
    logout: async (): Promise<void> => {
      await api.post('/api/auth/logout');
      
      // Remove o token do localStorage
      removeToken();
    },
  };
};
