import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getToken } from './storage';

/**
 * Backend Port
 */
export const BACKEND_PORT = '5000';

/**
 * Fallback IP in case auto-detection cannot resolve the host
 */
export const BACKEND_IP = '192.168.1.111';

let customBaseUrl = null;

export function setCustomBaseUrl(url) {
  customBaseUrl = url;
}

/**
 * Automatically detects the host machine's IP address from Expo Metro bundler.
 * In development / Expo Go, the phone connects to Metro at <PC_IP>:8081.
 * Extracting that IP ensures EVERY team member automatically connects to their own
 * backend without hardcoding or conflicting with each other's networks.
 */
export function getHostIp() {
  // 1. Explicit environment variable override if provided
  if (process.env.EXPO_PUBLIC_BACKEND_IP) {
    return process.env.EXPO_PUBLIC_BACKEND_IP;
  }

  // 2. Modern Expo Config (hostUri e.g. "172.20.10.3:8081" or "192.168.1.111:8081")
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return ip;
    }
  }

  // 3. Expo Linking URI / Experience URL fallback (e.g. "exp://172.20.10.3:8081")
  const linkingUri = Constants.linkingUri || Constants.experienceUrl;
  if (linkingUri && linkingUri.includes('://')) {
    const raw = linkingUri.split('://')[1];
    const ip = raw?.split(':')[0]?.split('/')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return ip;
    }
  }

  return null;
}

export function getBaseUrl() {
  if (customBaseUrl) {
    return customBaseUrl;
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'web') {
    return `http://localhost:${BACKEND_PORT}/api`;
  }

  // Auto-detect the host machine's IP (works dynamically for every teammate!)
  const detectedIp = getHostIp();
  if (detectedIp) {
    return `http://${detectedIp}:${BACKEND_PORT}/api`;
  }

  if (Platform.OS === 'android') {
    // Android emulator alias for host machine
    return `http://10.0.2.2:${BACKEND_PORT}/api`;
  }

  // Fallback
  return `http://${BACKEND_IP}:${BACKEND_PORT}/api`;
}

/**
 * Standard API Request wrapper with automatic token handling and error parsing
 * @param {string} endpoint - e.g. '/auth/login' or '/health'
 * @param {object} options - fetch options
 */
export async function apiRequest(endpoint, options = {}) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  console.log(`[API] ${options.method || 'GET'} ${url}`);

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Attach JWT Bearer token if not already explicitly provided
  if (!headers.Authorization) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    if (!response.ok) {
      const errorMessage =
        data?.message ||
        (data?.error ? (typeof data.error === 'string' ? data.error : JSON.stringify(data.error)) : null) ||
        `Request failed with status ${response.status}`;

      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (
      error.name === 'AbortError' ||
      error.message?.includes('canceled') ||
      error.message?.includes('cancelled')
    ) {
      const timeoutError = new Error(
        `Connection timed out reaching backend at ${baseUrl}. Ensure your backend server is running and reachable.`
      );
      timeoutError.status = 408;
      throw timeoutError;
    }

    // Network / connection refused errors
    if (
      error.message &&
      (error.message.includes('Network request failed') ||
        error.message.includes('fetch failed'))
    ) {
      const networkError = new Error(
        `Cannot connect to backend at ${baseUrl}. Ensure your backend server is running.`
      );
      networkError.status = 0;
      throw networkError;
    }

    throw error;
  }
}
