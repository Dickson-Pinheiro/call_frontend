import { api } from './api';
import type { Rating, CreateRatingRequest, UpdateRatingRequest } from './types/rating.types';

export const ratingService = () => ({
  /**
   * Criar uma avaliação para uma chamada
   */
  createRating: async (data: CreateRatingRequest): Promise<Rating> => {
    const response = await api.post<Rating>('/api/ratings', data);
    return response.data;
  },

  /**
   * Obter avaliação por ID
   */
  getRatingById: async (id: number): Promise<Rating> => {
    const response = await api.get<Rating>(`/api/ratings/${id}`);
    return response.data;
  },

  /**
   * Listar todas as avaliações do usuário
   */
  getAllRatings: async (): Promise<Rating[]> => {
    const response = await api.get<Rating[]>('/api/ratings');
    return response.data;
  },

  /**
   * Listar avaliações com nota mínima
   */
  getRatingsByMinRating: async (minRating: number): Promise<Rating[]> => {
    const response = await api.get<Rating[]>(`/api/ratings/min-rating/${minRating}`);
    return response.data;
  },

  /**
   * Listar melhores avaliações (top)
   */
  getTopRatings: async (): Promise<Rating[]> => {
    const response = await api.get<Rating[]>('/api/ratings/top');
    return response.data;
  },

  /**
   * Listar avaliações positivas (>= 4)
   */
  getPositiveRatings: async (): Promise<Rating[]> => {
    const response = await api.get<Rating[]>('/api/ratings/positive');
    return response.data;
  },

  /**
   * Atualizar uma avaliação
   */
  updateRating: async (id: number, data: UpdateRatingRequest): Promise<Rating> => {
    const response = await api.put<Rating>(`/api/ratings/${id}`, data);
    return response.data;
  },

  /**
   * Deletar uma avaliação
   */
  deleteRating: async (id: number): Promise<void> => {
    await api.delete(`/api/ratings/${id}`);
  },
});
