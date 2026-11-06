import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'unimart_auth_token';
const USER_KEY = 'unimart_user_data';
const ONBOARDING_COMPLETED_KEY = 'unimart_onboarding_completed';
const HAS_ACCOUNT_KEY = 'unimart_has_account';

/**
 * Check if SecureStore is available on the current platform
 */
const isSecureStoreAvailable = Platform.OS !== 'web';

/**
 * Save JWT Auth Token
 * @param {string} token
 */
export async function saveToken(token) {
  try {
    if (isSecureStoreAvailable) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      localStorage.setItem(TOKEN_KEY, token);
    }
    return true;
  } catch (error) {
    console.error('Error saving auth token:', error);
    return false;
  }
}

/**
 * Retrieve JWT Auth Token
 * @returns {Promise<string|null>}
 */
export async function getToken() {
  try {
    if (isSecureStoreAvailable) {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } else {
      return localStorage.getItem(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
}

/**
 * Remove JWT Auth Token
 */
export async function removeToken() {
  try {
    if (isSecureStoreAvailable) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    return true;
  } catch (error) {
    console.error('Error deleting auth token:', error);
    return false;
  }
}

/**
 * Save user profile info
 * @param {object} user
 */
export async function saveUser(user) {
  try {
    const serialized = JSON.stringify(user);
    if (isSecureStoreAvailable) {
      await SecureStore.setItemAsync(USER_KEY, serialized);
    } else {
      localStorage.setItem(USER_KEY, serialized);
    }
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
}

/**
 * Retrieve user profile info
 * @returns {Promise<object|null>}
 */
export async function getUser() {
  try {
    const raw = isSecureStoreAvailable
      ? await SecureStore.getItemAsync(USER_KEY)
      : localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
}

/**
 * Remove user profile info
 */
export async function removeUser() {
  try {
    if (isSecureStoreAvailable) {
      await SecureStore.deleteItemAsync(USER_KEY);
    } else {
      localStorage.removeItem(USER_KEY);
    }
    return true;
  } catch (error) {
    console.error('Error deleting user data:', error);
    return false;
  }
}

/**
 * Clear all authentication data (logout)
 */
export async function clearAuth() {
  await removeToken();
  await removeUser();
}

/**
 * Mark onboarding as completed (only show once)
 */
export async function setOnboardingCompleted() {
  try {
    if (isSecureStoreAvailable) {
      await SecureStore.setItemAsync(ONBOARDING_COMPLETED_KEY, 'true');
    } else {
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    }
    return true;
  } catch (error) {
    console.error('Error setting onboarding status:', error);
    return false;
  }
}

/**
 * Check if onboarding was already completed / seen
 * @returns {Promise<boolean>}
 */
export async function isOnboardingCompleted() {
  try {
    const val = isSecureStoreAvailable
      ? await SecureStore.getItemAsync(ONBOARDING_COMPLETED_KEY)
      : localStorage.getItem(ONBOARDING_COMPLETED_KEY);
    return val === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}

/**
 * Mark that an account exists on this device
 * @param {boolean} hasAccount
 */
export async function setHasAccount(hasAccount = true) {
  try {
    const val = hasAccount ? 'true' : 'false';
    if (isSecureStoreAvailable) {
      await SecureStore.setItemAsync(HAS_ACCOUNT_KEY, val);
    } else {
      localStorage.setItem(HAS_ACCOUNT_KEY, val);
    }
    return true;
  } catch (error) {
    console.error('Error setting hasAccount status:', error);
    return false;
  }
}

/**
 * Check if user already has an account on this app
 * @returns {Promise<boolean>}
 */
export async function hasExistingAccount() {
  try {
    // 1. Direct key check
    const val = isSecureStoreAvailable
      ? await SecureStore.getItemAsync(HAS_ACCOUNT_KEY)
      : localStorage.getItem(HAS_ACCOUNT_KEY);
    if (val === 'true') return true;

    // 2. Check if a stored user exists
    const user = await getUser();
    if (user && (user.id || user.email)) return true;

    // 3. Check if a token exists
    const token = await getToken();
    if (token) return true;

    return false;
  } catch (error) {
    console.error('Error checking existing account:', error);
    return false;
  }
}
