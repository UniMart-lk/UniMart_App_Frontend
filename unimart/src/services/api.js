import { Platform } from 'react-native';
import { getToken } from './storage';

/**
 * Default backend configuration as specified:
 * - Physical device (Expo Go): http://172.20.10.3:5000/api
 * - Android Emulator: http://10.0.2.2:5000/api
 * - iOS Simulator / Web: http://localhost:5000/api
 */
export const BACKEND_IP = '192.168.8.244';
export const BACKEND_PORT = '5000';

let customBaseUrl = null;

export function setCustomBaseUrl(url) {
  customBaseUrl = url;
}

export function getBaseUrl() {
  if (customBaseUrl) {
    return customBaseUrl;
  }

  if (Platform.OS === 'web') {
    return `http://localhost:${BACKEND_PORT}/api`;
  }

  // Use the physical device IP provided (works for Expo Go on LAN)
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
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Connection timed out. Please verify your backend server is running and reachable.');
      timeoutError.status = 408;
      throw timeoutError;
    }

    // Network / connection refused errors
    if (error.message && error.message.includes('Network request failed')) {
      const networkError = new Error(`Cannot connect to backend at ${baseUrl}. Ensure your backend server is running.`);
      networkError.status = 0;
      throw networkError;
    }

    throw error;
  }
}
