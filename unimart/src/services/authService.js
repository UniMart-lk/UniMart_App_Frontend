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
  setProfileCompleted,
  isProfileCompletedStorage,
  getStoredBadgeType,
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
    try {
      const response = await apiRequest('/auth/me', { method: 'GET' });
      const user = response?.data?.user;
      if (user) {
        // If profile was completed on device, ensure completion is preserved
        const completedOnDevice = await isProfileCompletedStorage();
        if (completedOnDevice) {
          if (!user.userProfile) user.userProfile = {};
          user.userProfile.isCompleted = true;
        }
        await saveUser(user);
        return user;
      }
    } catch (err) {
      // Return null on network error to allow using local stored user
    }
    return null;
  },

  /**
   * Update profile details and persist locally and on backend
   * @param {object} profileData
   */
  async updateProfile(profileData) {
    const detectedBadge = profileData.badgeType || (
      profileData.isProvider
        ? (profileData.providerType === 'EXTERNAL_PROVIDER' ? 'EXTERNAL_PROVIDER' : 'STUDENT_PROVIDER')
        : 'STUDENT'
    );

    // Save completion flag & badge type locally
    await setProfileCompleted(true, detectedBadge);

    try {
      const response = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      const updatedUser = response?.data?.user;
      if (updatedUser) {
        if (!updatedUser.userProfile) updatedUser.userProfile = {};
        updatedUser.userProfile.isCompleted = true;
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
      role: profileData.isProvider ? 'PROVIDER' : (currentUser.role || 'USER'),
      userProfile: {
        ...(currentUser.userProfile || {}),
        fullName: profileData.fullName || currentUser.userProfile?.fullName,
        userType: profileData.isProvider
          ? (profileData.providerType === 'EXTERNAL_PROVIDER' ? 'EXTERNAL' : 'STUDENT')
          : 'STUDENT',
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
              providerType:
                profileData.providerType ||
                currentUser.providerProfile?.providerType ||
                (profileData.isProvider ? 'STUDENT_PROVIDER' : undefined),
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

  /**
   * Check if profile has been marked completed on device
   */
  async isProfileCompleted() {
    return await isProfileCompletedStorage();
  },

  /**
   * Mark profile as completed on device
   */
  async setProfileCompleted(completed = true, badgeType = null) {
    return await setProfileCompleted(completed, badgeType);
  },

  /**
   * Get stored badge type
   */
  async getStoredBadgeType() {
    return await getStoredBadgeType();
  },
};

export default authService;
