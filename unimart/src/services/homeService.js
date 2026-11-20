import { apiRequest } from './api';

export const homeService = {
  async getHomeFeed(options = {}) {
    try {
      const limit = options.limit || 10;
      const response = await apiRequest(`/home?limit=${limit}`, { method: 'GET' });
      return response?.data || null;
    } catch (error) {
      console.warn('Failed to load home feed from backend:', error.message);
      return null;
    }
  },
};

export default homeService;
