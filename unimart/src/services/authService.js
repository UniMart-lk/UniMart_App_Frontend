import { apiRequest } from './api';
import { saveToken, saveUser, clearAuth, getUser, getToken } from './storage';

/**
 * Auth Service module for UniMart
 */
export const authService = {
  /**
   * Health check for backend server
   */
  async checkHealth() {
    return await apiRequest('/health', { method: 'GET' });
  },

  /**
   * Authenticate user with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ token: string, user: object }>}
   */
  async login(email, password) {
    const trimmedEmail = email?.trim();

    if (!trimmedEmail || !password) {
      throw new Error('Please enter both email and password.');
    }

    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: trimmedEmail,
        password: password,
      }),
    });

    const token = response?.data?.token;
    const user = response?.data?.user;

    if (!token) {
      throw new Error('No authentication token received from server.');
    }

    // Persist token and user in secure storage
    await saveToken(token);
    if (user) {
      await saveUser(user);
    }

    return { token, user };
  },

  /**
   * Register a new user (Buyer/Renter or Provider)
   * @param {object} payload - { email, password, contactNumber, role, providerType, verificationData }
   * @returns {Promise<{ token: string, user: object }>}
   */
  async register(payload) {
    const trimmedEmail = payload?.email?.trim();
    const password = payload?.password;

    if (!trimmedEmail || !password) {
      throw new Error('Please enter both email and password.');
    }

    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        email: trimmedEmail,
      }),
    });

    const token = response?.data?.token;
    const user = response?.data?.user;

    return { token, user, message: response?.message };
  },

  /**
   * Fetch current authenticated user profile
   * @returns {Promise<object>}
   */
  async getCurrentUser() {
    const response = await apiRequest('/auth/me', { method: 'GET' });
    return response?.data?.user;
  },

  /**
   * Retrieve cached user from local storage
   */
  async getStoredUser() {
    return await getUser();
  },

  /**
   * Retrieve cached token from local storage
   */
  async getStoredToken() {
    return await getToken();
  },

  /**
   * Check if user has an active session
   */
  async isAuthenticated() {
    const token = await getToken();
    return !!token;
  },

  /**
   * Log out and clear local credentials
   */
  async logout() {
    await clearAuth();
  },
};

export default authService;
