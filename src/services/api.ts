import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: BASE_URL,
});

const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('token');
};

export const setUserId = (userId: number): void => {
  localStorage.setItem('userId', userId.toString());
};

export const getUserId = (): number | null => {
  const userId = localStorage.getItem('userId');
  return userId ? parseInt(userId, 10) : null;
};

export const removeUserId = (): void => {
  localStorage.removeItem('userId');
};

export const setUserName = (name: string): void => {
  localStorage.setItem('userName', name);
};

export const getUserName = (): string | null => {
  return localStorage.getItem('userName');
};

export const removeUserName = (): void => {
  localStorage.removeItem('userName');
};

export const setUserEmail = (email: string): void => {
  localStorage.setItem('userEmail', email);
};

export const getUserEmail = (): string | null => {
  return localStorage.getItem('userEmail');
};

export const removeUserEmail = (): void => {
  localStorage.removeItem('userEmail');
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

export default api;
