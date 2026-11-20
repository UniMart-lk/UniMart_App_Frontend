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
  async getFeaturedProducts(limit = 10) {
    try {
      const response = await apiRequest(`/home/featured-products?limit=${limit}`, { method: 'GET' });
      return response?.data?.products || [];
    } catch {
      return [];
    }
  },

  async getFeaturedRentals(limit = 10) {
    try {
      const response = await apiRequest(`/home/featured-rentals?limit=${limit}`, { method: 'GET' });
      return response?.data?.rentals || [];
    } catch {
      return [];
    }
  },
  async getCategories() {
    try {
      const response = await apiRequest('/home/categories', { method: 'GET' });
      return response?.data?.categories || [];
    } catch {
      return [];
    }
  },

  async getNotificationCount() {
    try {
      const response = await apiRequest('/home/notifications-count', { method: 'GET' });
      return response?.data || { unreadNotifications: 0, unreadMessages: 0 };
    } catch {
      return { unreadNotifications: 0, unreadMessages: 0 };
    }
  },
};

export default homeService;
