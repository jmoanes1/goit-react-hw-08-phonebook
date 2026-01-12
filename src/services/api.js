/**
 * GoIT Connections API Service
 * 
 * A clean, modular API wrapper for the GoIT Connections API
 * Handles authentication, token management, and CRUD operations for contacts
 */

import axios from 'axios';
import { BASE_URL } from '../utils/axiosConfig';

// Token storage key
const TOKEN_KEY = 'auth_token';

/**
 * Create axios instance with default configuration
 * Uses centralized configuration for GitHub Pages compatibility
 */
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // GitHub Pages compatibility
});

/**
 * Token Management
 * Stores and retrieves JWT token from localStorage
 */
export const tokenService = {
  /**
   * Get token from localStorage
   * @returns {string|null} The JWT token or null if not found
   */
  get: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Save token to localStorage and set axios header
   * @param {string} token - The JWT token to save
   */
  set: (token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      // Set default authorization header for all requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  },

  /**
   * Remove token from localStorage and clear axios header
   */
  remove: () => {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common['Authorization'];
  },

  /**
   * Check if user is authenticated (has valid token)
   * @returns {boolean} True if token exists
   */
  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};

// Initialize token on module load
const savedToken = tokenService.get();
if (savedToken) {
  tokenService.set(savedToken);
}

/**
 * Request interceptor - automatically attach token to requests
 */
api.interceptors.request.use(
  (config) => {
    const token = tokenService.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handle token expiration
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 Unauthorized, token might be expired
    if (error.response?.status === 401) {
      tokenService.remove();
      // You can dispatch a logout action here if using Redux
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication API
 */
export const authAPI = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.name - User's name
   * @param {string} userData.email - User's email
   * @param {string} userData.password - User's password
   * @returns {Promise<Object>} User data and token
   */
  signup: async (userData) => {
    const response = await api.post('/users/signup', userData);
    // Automatically save token after successful signup
    if (response.data.token) {
      tokenService.set(response.data.token);
    }
    return response.data;
  },

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User's email
   * @param {string} credentials.password - User's password
   * @returns {Promise<Object>} User data and token
   */
  login: async (credentials) => {
    const response = await api.post('/users/login', credentials);
    // Automatically save token after successful login
    if (response.data.token) {
      tokenService.set(response.data.token);
    }
    return response.data;
  },

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  logout: async () => {
    try {
      await api.post('/users/logout');
    } catch (error) {
      // Even if API call fails, clear local token
      console.error('Logout API error:', error);
    } finally {
      // Always remove token locally
      tokenService.remove();
    }
  },

  /**
   * Get current user information
   * @returns {Promise<Object>} Current user data
   */
  getCurrentUser: async () => {
    const response = await api.get('/users/current');
    return response.data;
  },

  /**
   * Update user information
   * @param {Object} userData - Updated user data
   * @param {string} [userData.name] - Updated name
   * @param {string} [userData.email] - Updated email
   * @param {string} [userData.password] - Updated password
   * @returns {Promise<Object>} Updated user data
   */
  updateUser: async (userData) => {
    const response = await api.patch('/users', userData);
    return response.data;
  },
};

/**
 * Contacts API
 */
export const contactsAPI = {
  /**
   * Get all contacts
   * @returns {Promise<Array>} Array of contact objects
   */
  getAll: async () => {
    const response = await api.get('/contacts');
    return response.data;
  },

  /**
   * Get a single contact by ID
   * @param {string} contactId - Contact ID
   * @returns {Promise<Object>} Contact object
   */
  getById: async (contactId) => {
    const response = await api.get(`/contacts/${contactId}`);
    return response.data;
  },

  /**
   * Add a new contact
   * @param {Object} contact - Contact data
   * @param {string} contact.name - Contact name
   * @param {string} contact.number - Contact phone number
   * @returns {Promise<Object>} Created contact object
   */
  add: async (contact) => {
    const response = await api.post('/contacts', contact);
    return response.data;
  },

  /**
   * Update an existing contact
   * @param {string} contactId - Contact ID
   * @param {Object} contactData - Updated contact data
   * @param {string} [contactData.name] - Updated name
   * @param {string} [contactData.number] - Updated phone number
   * @returns {Promise<Object>} Updated contact object
   */
  update: async (contactId, contactData) => {
    const response = await api.patch(`/contacts/${contactId}`, contactData);
    return response.data;
  },

  /**
   * Delete a contact
   * @param {string} contactId - Contact ID
   * @returns {Promise<void>}
   */
  delete: async (contactId) => {
    await api.delete(`/contacts/${contactId}`);
  },
};

// Export default API instance for custom requests
export default api;

