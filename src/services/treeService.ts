import axios from 'axios';
import type { AllTreesResponse, TreeStructure, TreeType } from './types/tree.types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// API pública - não requer autenticação
const publicApi = axios.create({
  baseURL: `${BASE_URL}/api/public/trees`,
});

export const treeService = () => {
  return {
    /**
     * Busca todas as árvores
     * GET /api/public/trees
     */
    getAllTrees: async (): Promise<AllTreesResponse> => {
      const response = await publicApi.get<AllTreesResponse>('');
      return response.data;
    },

    /**
     * Busca uma árvore específica
     * GET /api/public/trees/{type}
     */
    getTreeByType: async (type: TreeType): Promise<TreeStructure> => {
      const response = await publicApi.get<TreeStructure>(`/${type}`);
      return response.data;
    },
  };
};
