/**
 * Axios Configuration for Production
 * 
 * Centralized Axios configuration with proper settings for GitHub Pages deployment
 * Handles HTTPS enforcement, timeouts, error handling, and CORS
 */

import axios from 'axios';

// Ensure HTTPS API URL (GitHub Pages requires HTTPS for external API calls)
const BASE_URL = 'https://connections-api.goit.global';

// Validate that we're using HTTPS
if (BASE_URL && !BASE_URL.startsWith('https://')) {
  console.warn('API URL must use HTTPS for production deployment');
}

/**
 * Create a configured axios instance with production-ready settings
 */
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 second timeout for GitHub Pages compatibility
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // GitHub Pages compatibility settings
  withCredentials: false, // GitHub Pages doesn't support credentials
  validateStatus: (status) => {
    // Accept status codes less than 500 as success (including 4xx for proper error handling)
    return status < 500;
  },
});

/**
 * Request interceptor - Add auth token and handle requests
 */
axiosInstance.interceptors.request.use(
  (config) => {
    // Ensure HTTPS is used
    if (config.url && !config.url.startsWith('https://') && !config.url.startsWith('http://')) {
      // Relative URL, baseURL will handle it
    } else if (config.url && config.url.startsWith('http://')) {
      // Force HTTPS
      config.url = config.url.replace('http://', 'https://');
    }

    // Get token from localStorage or IndexedDB
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add timestamp to prevent caching issues
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(), // Cache busting parameter
      };
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors and token expiration
 */
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors (ERR_NETWORK, CORS, etc.)
    if (!error.response) {
      // Network error - could be CORS, timeout, or connection issue
      const networkError = {
        message: error.message || 'Network error. Please check your connection.',
        code: error.code || 'ERR_NETWORK',
        isNetworkError: true,
      };

      // Log in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Network Error:', {
          message: error.message,
          code: error.code,
          url: originalRequest?.url,
          baseURL: originalRequest?.baseURL,
        });
      }

      return Promise.reject(networkError);
    }

    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401) {
      // Clear token
      localStorage.removeItem('auth_token');
      delete axiosInstance.defaults.headers.common['Authorization'];
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        // Don't redirect automatically - let the app handle it
        if (process.env.NODE_ENV === 'development') {
          console.warn('Token expired, user needs to log in again');
        }
      }
    }

    // Handle CORS errors
    if (error.message && error.message.includes('CORS')) {
      const corsError = {
        message: 'CORS error. The API may not be accessible from this origin.',
        code: 'ERR_CORS',
        isNetworkError: true,
      };
      return Promise.reject(corsError);
    }

    return Promise.reject(error);
  }
);

/**
 * Configure default axios instance as well (for backward compatibility)
 */
axios.defaults.baseURL = BASE_URL;
axios.defaults.timeout = 30000;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// Apply same interceptors to default axios instance
axios.interceptors.request.use(
  (config) => {
    // Ensure HTTPS
    if (config.url && config.url.startsWith('http://')) {
      config.url = config.url.replace('http://', 'https://');
    }

    // Add token if available
    const token = localStorage.getItem('auth_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      const networkError = {
        message: error.message || 'Network error',
        code: error.code || 'ERR_NETWORK',
        isNetworkError: true,
      };
      return Promise.reject(networkError);
    }

    // Handle 401
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      delete axios.defaults.headers.common['Authorization'];
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
export { BASE_URL };

