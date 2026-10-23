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
   * Request 6-digit password reset code
   * @param {string} email
   */
  async forgotPassword(email) {
    const trimmedEmail = email?.trim();
    if (!trimmedEmail) {
      throw new Error('Please enter your email address.');
    }

    return await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: trimmedEmail }),
    });
  },

  /**
   * Verify 6-digit password reset OTP
   * @param {string} email
   * @param {string} code
   */
  async verifyResetCode(email, code) {
    const trimmedEmail = email?.trim();
    const trimmedCode = code?.trim();

    if (!trimmedEmail || !trimmedCode) {
      throw new Error('Email and verification code are required.');
    }

    return await apiRequest('/auth/verify-reset-code', {
      method: 'POST',
      body: JSON.stringify({ email: trimmedEmail, code: trimmedCode }),
    });
  },

  /**
   * Reset password with verified code/token
   * @param {object} param - { email, newPassword, resetToken, code }
   */
  async resetPassword({ email, newPassword, resetToken, code }) {
    const trimmedEmail = email?.trim();

    if (!trimmedEmail || !newPassword) {
      throw new Error('Email and new password are required.');
    }

    return await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: trimmedEmail,
        newPassword,
        resetToken,
        code,
      }),
    });
  },

  /**
   * Log out and clear local credentials
   */
  async logout() {
    await clearAuth();
  },
};

export default authService;
