import { apiRequest } from './api';
import { products as fallbackProducts } from '../features/marketplace/data/mockData';

/**
 * Marketplace Service module for UniMart
 * Handles communication with the backend marketplace endpoints
 */
export const marketplaceService = {
  /**
   * Fetch marketplace product feed with optional filters
   * @param {Object} params - { category, search, sort, maxPrice, conditions, minRating, providerType }
   * @returns {Promise<Array>} List of formatted product objects
   */
  async getProducts(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (params.category && params.category !== 'All') {
        queryParams.append('category', params.category);
      }
      if (params.search && params.search.trim() !== '') {
        queryParams.append('search', params.search.trim());
      }
      if (params.sort) {
        queryParams.append('sort', params.sort);
      }
      if (params.maxPrice !== undefined && params.maxPrice !== null) {
        queryParams.append('maxPrice', params.maxPrice);
      }
      if (params.conditions && params.conditions.length > 0) {
        queryParams.append('conditions', Array.isArray(params.conditions) ? params.conditions.join(',') : params.conditions);
      }
      if (params.minRating && Number(params.minRating) > 0) {
        queryParams.append('minRating', params.minRating);
      }
      if (params.providerType && params.providerType !== 'All') {
        queryParams.append('providerType', params.providerType);
      }

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/marketplace?${queryString}` : '/marketplace';

      const response = await apiRequest(endpoint, { method: 'GET' });
      const products = response?.data?.products;

      if (Array.isArray(products) && products.length > 0) {
        return products;
      }

      // If backend returned empty list but filters were applied, return empty list
      if (Array.isArray(products)) {
        return products;
      }

      return fallbackProducts;
    } catch (error) {
      console.warn('Marketplace feed API call failed, falling back to local data:', error.message);
      return fallbackProducts;
    }
  },

  /**
   * Fetch a single product by its ID
   * @param {string|number} id
   * @returns {Promise<Object>}
   */
  async getProductById(id) {
    try {
      const numericId = Number(id);
      if (!isNaN(numericId) && numericId > 0) {
        const response = await apiRequest(`/marketplace/${numericId}`, { method: 'GET' });
        if (response?.data) {
          return response.data;
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch product ${id} from API, using fallback:`, error.message);
    }

    // Fallback to mockData
    const found = fallbackProducts.find((p) => p.id === String(id) || p.id === id);
    return found || fallbackProducts[0];
  },

  /**
   * Fetch all active marketplace categories
   * @returns {Promise<Array>}
   */
  async getCategories() {
    try {
      const response = await apiRequest('/marketplace/categories', { method: 'GET' });
      if (Array.isArray(response?.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (error) {
      console.warn('Failed to fetch categories from API:', error.message);
    }

    return [
      { name: 'Books', slug: 'books' },
      { name: 'Electronics', slug: 'electronics' },
      { name: 'Furniture', slug: 'furniture' },
      { name: 'Clothing', slug: 'clothing' },
      { name: 'Stationery', slug: 'stationery' },
      { name: 'Sports', slug: 'sports' },
    ];
  },

  /**
   * Create a new marketplace product
   * @param {Object} productData
   * @returns {Promise<Object>}
   */
  async createProduct(productData) {
    const response = await apiRequest('/marketplace', {
      method: 'POST',
      body: JSON.stringify(productData),
    });

    return response?.data;
  },

  /**
   * Fetch user's own product listings
   * @returns {Promise<Array>}
   */
  async getMyListings() {
    try {
      const response = await apiRequest('/marketplace/my-listings', { method: 'GET' });
      if (Array.isArray(response?.data)) {
        return response.data;
      }
    } catch (error) {
      console.warn('Failed to fetch my listings from API, using local fallback:', error.message);
    }

    // Fallback: Return mock products tagged with status
    return fallbackProducts.map((item, idx) => ({
      ...item,
      viewsCount: 24 + idx * 17,
      status: idx === 3 ? 'sold' : 'active',
      inquiriesCount: 2 + idx,
    }));
  },

  /**
   * Update product status (e.g. mark as sold or available)
   * @param {string|number} id
   * @param {string} status - 'active' | 'sold'
   * @returns {Promise<Object>}
   */
  async updateProductStatus(id, status) {
    const response = await apiRequest(`/marketplace/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    return response?.data;
  },

  /**
   * Delete a product listing
   * @param {string|number} id
   * @returns {Promise<Object>}
   */
  async deleteProduct(id) {
    const response = await apiRequest(`/marketplace/${id}`, {
      method: 'DELETE',
    });

    return response;
  },
};

export default marketplaceService;
