import { apiRequest } from './api';
import {
  saveToken,
  saveUser,
  clearAuth,
  getUser,
  getToken,
  setOnboardingCompleted,
  isOnboardingCompleted,
  setHasAccount,
  hasExistingAccount,
} from './storage';

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

    // Mark account exists and onboarding completed so welcome screens are never shown again
    await setHasAccount(true);
    await setOnboardingCompleted();

    return { token, user };
  },

  /**
   * Register a new user and persist credentials
   * @param {object} registrationData
   * @returns {Promise<{ token: string, user: object }>}
   */
  async register(registrationData) {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });

    const token = response?.data?.token;
    const user = response?.data?.user;

    if (token) {
      await saveToken(token);
    }
    if (user) {
      await saveUser(user);
    }

    // Mark account exists and onboarding completed so welcome screens are never shown again
    await setHasAccount(true);
    await setOnboardingCompleted();

    return { token, user };
  },

  /**
   * Fetch current authenticated user profile
   * @returns {Promise<object>}
   */
  async getCurrentUser() {
    const response = await apiRequest('/auth/me', { method: 'GET' });
    const user = response?.data?.user;
    if (user) {
      await saveUser(user);
    }
    return user;
  },

  /**
   * Update profile details and persist locally and on backend
   * @param {object} profileData
   */
  async updateProfile(profileData) {
    try {
      const response = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      const updatedUser = response?.data?.user;
      if (updatedUser) {
        await saveUser(updatedUser);
        return updatedUser;
      }
    } catch (err) {
      console.log('Backend profile sync failed or offline, updating locally:', err.message);
    }

    // Merge into local storage as fallback
    const currentUser = (await getUser()) || {};
    const mergedUser = {
      ...currentUser,
      userProfile: {
        ...(currentUser.userProfile || {}),
        fullName: profileData.fullName || currentUser.userProfile?.fullName,
        university: profileData.university !== undefined ? profileData.university : currentUser.userProfile?.university,
        faculty: profileData.faculty !== undefined ? profileData.faculty : currentUser.userProfile?.faculty,
        universityIdNumber: profileData.studentRegistrationNumber || currentUser.userProfile?.universityIdNumber,
        nicNumber: profileData.nicNumber || currentUser.userProfile?.nicNumber,
        profilePictureUrl: profileData.profilePictureUrl || currentUser.userProfile?.profilePictureUrl,
        isCompleted: true,
      },
      providerProfile:
        currentUser.providerProfile || profileData.isProvider
          ? {
              ...(currentUser.providerProfile || {}),
              displayName:
                profileData.providerDisplayName ||
                currentUser.providerProfile?.displayName ||
                profileData.fullName,
              description: profileData.description || currentUser.providerProfile?.description,
              businessName: profileData.businessName || currentUser.providerProfile?.businessName,
              serviceArea: profileData.serviceArea || currentUser.providerProfile?.serviceArea,
            }
          : undefined,
    };

    await saveUser(mergedUser);
    return mergedUser;
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

  /**
   * Check if user already has an account on this app
   */
  async hasExistingAccount() {
    return await hasExistingAccount();
  },

  /**
   * Check if onboarding has already been completed / seen
   */
  async isOnboardingCompleted() {
    return await isOnboardingCompleted();
  },

  /**
   * Mark onboarding as completed
   */
  async setOnboardingCompleted() {
    return await setOnboardingCompleted();
  },
};

export default authService;
