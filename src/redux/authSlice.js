import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { mockRegisterUser, mockLoginUser, mockRefreshUser, mockUpdateUser } from '../services/mockApi';
import { dbSaveToken, dbGetToken, dbRemoveToken } from '../services/db';

// Set the base URL for the backend API
const BASE_URL = 'https://connections-api.goit.global';

// Utility to save token to IndexedDB and set axios header
const setAuthHeader = async (token) => {
  if (token) {
    // Save token to IndexedDB
    try {
      await dbSaveToken(token);
    } catch (error) {
      console.error('Error saving token to IndexedDB:', error);
    }
    // Set axios default header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    // Remove token from IndexedDB
    try {
      await dbRemoveToken();
    } catch (error) {
      console.error('Error removing token from IndexedDB:', error);
    }
    // Remove axios default header
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Utility to get token from IndexedDB (synchronous fallback for initial state)
const getTokenFromStorage = () => {
  // For synchronous access (like initial state), fallback to localStorage
  // This is only used during initialization before IndexedDB is ready
  return localStorage.getItem('auth_token');
};

// Utility to get token from IndexedDB (async version)
const getTokenFromStorageAsync = async () => {
  try {
    return await dbGetToken();
  } catch (error) {
    console.error('Error getting token from IndexedDB:', error);
    // Fallback to localStorage
    return localStorage.getItem('auth_token');
  }
};

// Check if we should use mock API (only in development or when explicitly needed)
// Also check localStorage as a fallback in case env var isn't loaded
const getUseMockAPI = () => {
  const envValue = process.env.REACT_APP_USE_MOCK_API;
  const localStorageValue = localStorage.getItem('USE_MOCK_API');
  
  // Check environment variable first
  if (process.env.NODE_ENV === 'development' && envValue === 'true') {
    return true;
  }
  
  // Fallback to localStorage check (for manual override)
  if (localStorageValue === 'true') {
    return true;
  }
  
  return false;
};

const USE_MOCK_API = getUseMockAPI();

// Log mock API status in development
if (process.env.NODE_ENV === 'development') {
  console.log('=== Mock API Configuration ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('REACT_APP_USE_MOCK_API:', process.env.REACT_APP_USE_MOCK_API);
  console.log('Mock API fallback:', USE_MOCK_API ? 'ENABLED' : 'DISABLED');
  if (USE_MOCK_API) {
    console.log('Note: Mock API will be used when real API is unreachable');
  } else {
    console.log('Tip: Set REACT_APP_USE_MOCK_API=true in .env file to enable mock API fallback');
  }
  console.log('================================');
}

// Register user
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/users/signup`, userData);
      await setAuthHeader(response.data.token);
      return response.data;
    } catch (error) {
      // Log error details only in development or when explicitly needed
      if (process.env.NODE_ENV === 'development') {
        console.error('Registration API Error:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText
        });
      }

      // Handle server response errors
      if (error.response) {
        return rejectWithValue({
          status: error.response.status,
          message: error.response.data?.message || 'Registration failed',
          data: error.response.data
        });
      }

      // Handle network errors (no response received)
      // Check for network error by multiple conditions
      const isNetworkError = error.request || 
                            error.message === 'Network Error' || 
                            error.code === 'ERR_NETWORK' ||
                            error.code === 'ECONNABORTED' ||
                            !error.response;

      if (isNetworkError) {
        // Automatically use mock API as fallback for network errors (since we have IndexedDB database)
        console.warn('Registration: Real API unreachable, using IndexedDB mock API as fallback');
        try {
          const mockResponse = await mockRegisterUser(userData);
          await setAuthHeader(mockResponse.data.token);
          console.log('Registration: Mock API registration successful');
          return mockResponse.data;
        } catch (mockError) {
          // Handle mock API errors
          if (mockError.response) {
            return rejectWithValue({
              status: mockError.response.status,
              message: mockError.response.data?.message || 'Registration failed',
              data: mockError.response.data
            });
          }
          // If mock API fails for other reasons, return the error
          return rejectWithValue({
            message: mockError.message || 'Registration failed',
            networkError: false
          });
        }
      }

      // Other errors
      return rejectWithValue({
        message: error.message || 'Registration failed due to unexpected error'
      });
    }
  }
);

// Login user
export const loginUser = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/users/login`, userData);
      await setAuthHeader(response.data.token);
      return response.data;
    } catch (error) {
      // Log error details in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Login API Error:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          hasResponse: !!error.response,
          hasRequest: !!error.request,
          isNetworkError: error.message === 'Network Error' || error.code === 'ERR_NETWORK'
        });
      }

      // Handle server response errors (4xx, 5xx)
      if (error.response) {
        // For 400 Bad Request, provide more specific error message
        if (error.response.status === 400) {
          const errorMessage = error.response.data?.message || 
                              error.response.data?.error?.message ||
                              'Invalid email or password. Please check your credentials and try again.';
          return rejectWithValue({
            status: error.response.status,
            message: errorMessage,
            data: error.response.data
          });
        }
        // For other server errors
        return rejectWithValue({
          status: error.response.status,
          message: error.response.data?.message || 'Login failed',
          data: error.response.data
        });
      }

      // Handle network errors (no response received)
      // Check for network error by multiple conditions
      const isNetworkError = error.request || 
                            error.message === 'Network Error' || 
                            error.code === 'ERR_NETWORK' ||
                            error.code === 'ECONNABORTED' ||
                            !error.response;

      if (isNetworkError) {
        // Automatically use mock API as fallback for network errors (since we have IndexedDB database)
        console.warn('Login: Real API unreachable, using IndexedDB mock API as fallback');
        try {
          const mockResponse = await mockLoginUser(userData);
          await setAuthHeader(mockResponse.data.token);
          console.log('Login: Mock API login successful');
          return mockResponse.data;
        } catch (mockError) {
          // Handle mock API errors
          if (mockError.response) {
            return rejectWithValue({
              status: mockError.response.status,
              message: mockError.response.data?.message || 'Login failed',
              data: mockError.response.data
            });
          }
          // If mock API fails for other reasons, return helpful error
          return rejectWithValue({
            message: mockError.message || 'Login failed. Please register first if using mock API.',
            networkError: false
          });
        }
      }

      // Other errors
      return rejectWithValue({
        message: error.message || 'Login failed due to unexpected error'
      });
    }
  }
);

// Logout user
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue, getState }) => {
    // Get token from state or storage before clearing
    const { auth } = getState();
    let token = auth.token;
    
    // If token not in state, try to get it from storage
    if (!token) {
      token = await getTokenFromStorageAsync();
    }
    
    // Ensure token is set in axios headers before making logout request
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      // Try to call logout API endpoint with proper Authorization header
      // Use axios directly with explicit headers to ensure token is sent
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Only add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      await axios.post(
        `${BASE_URL}/users/logout`,
        {},
        {
          headers: headers,
          // Ensure credentials are included for cross-origin requests
          withCredentials: false, // API doesn't use cookies, so false is fine
        }
      );
    } catch (error) {
      // Even if API call fails, we should still log out locally
      // This handles cases where the API is down or network fails
      // Only log in development to reduce console noise
      if (process.env.NODE_ENV === 'development') {
        console.log('Logout API call failed, but clearing local session (this is expected if server is unreachable)');
      }
    } finally {
      // Always clear token and auth header, regardless of API call result
      await setAuthHeader(null);
    }
    // Always return success to ensure state is cleared
    return;
  }
);

// Refresh user (get current user)
export const refreshUser = createAsyncThunk(
  'auth/refresh',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      // Get token from state, localStorage, or IndexedDB (in case state was lost on refresh)
      let token = auth.token || getTokenFromStorage();
      
      // If token not found in state or localStorage, try IndexedDB (async)
      if (!token) {
        token = await getTokenFromStorageAsync();
      }
      
      if (!token) {
        // No token available, user is not logged in
        // Only log in development to reduce console noise
        if (process.env.NODE_ENV === 'development') {
          console.log('User not authenticated or token expired');
        }
        return rejectWithValue({ message: 'No token available' });
      }
      await setAuthHeader(token);
      try {
        const response = await axios.get(`${BASE_URL}/users/current`);
        return response.data;
      } catch (error) {
        // Handle authentication errors specifically
        if (error.response?.status === 401) {
          // Invalid token, clear it
          await setAuthHeader(null);
          return rejectWithValue({ message: 'Invalid or expired token' });
        }

        // Check if this is a network error (no response from server)
        const isNetworkError = error.request || 
                              error.message === 'Network Error' || 
                              error.code === 'ERR_NETWORK' ||
                              error.code === 'ECONNABORTED' ||
                              !error.response;

        // Automatically use mock API as fallback for network errors (since we have IndexedDB database)
        if (isNetworkError) {
          console.warn('Refresh: Real API unreachable, using IndexedDB mock API as fallback');
          try {
            const mockResponse = await mockRefreshUser(token);
            return mockResponse.data;
          } catch (mockError) {
            if (mockError.response && mockError.response.status === 401) {
              await setAuthHeader(null);
              return rejectWithValue({ message: 'Invalid or expired token' });
            }
            // For other mock errors, don't clear token - might be temporary issue
            return rejectWithValue({ message: 'Failed to refresh user. Please try again.' });
          }
        }

        // For other server errors (not network errors), return the error
        // Don't use mock API for server errors - these are real API responses
        return rejectWithValue({ message: 'Failed to refresh user. Please try again.' });
      }
    } catch (error) {
      // Only clear token if it's definitely invalid
      const token = getTokenFromStorage();
      if (!token) {
        return rejectWithValue({ message: 'No token available' });
      }
      // Don't clear token on other errors - might be temporary
      return rejectWithValue({ message: 'Failed to refresh user' });
    }
  }
);

// Update user
export const updateUser = createAsyncThunk(
  'auth/updateUser',
  async (userData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const token = auth.token || await getTokenFromStorageAsync();
      if (!token) {
        return rejectWithValue({ message: 'No token available. Please log in again.' });
      }
      await setAuthHeader(token);
      try {
        const response = await axios.patch(`${BASE_URL}/users`, userData);
        return response.data;
      } catch (error) {
        // Log error details only in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Update API Error:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText
          });
        }

        // Handle server response errors
        if (error.response) {
          return rejectWithValue({
            status: error.response.status,
            message: error.response.data?.message || 'Update failed',
            data: error.response.data
          });
        }

        // Handle network errors
        if (error.request) {
          // Automatically use mock API as fallback for network errors (since we have IndexedDB database)
          console.warn('Update: Real API unreachable, using IndexedDB mock API as fallback');
          try {
            const mockResponse = await mockUpdateUser(token, userData);
            return mockResponse.data;
          } catch (mockError) {
            if (mockError.response) {
              return rejectWithValue({
                status: mockError.response.status,
                message: mockError.response.data?.message || 'Update failed',
                data: mockError.response.data
              });
            }
            return rejectWithValue({
              message: mockError.message || 'Update failed',
              networkError: false
            });
          }
        }

        // Other errors
        return rejectWithValue({
          message: error.message || 'Update failed due to unexpected error'
        });
      }
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Update failed due to unexpected error'
      });
    }
  }
);

// Initialize state - only restore token, user data will be fetched from API
// The API (https://connections-api.goit.global) is the source of truth for user data
// Token is stored locally for persistence, but user data is always fetched from API
const getInitialState = () => {
  const token = getTokenFromStorage(); // Uses localStorage fallback for sync access
  if (token) {
    // Set axios header if token exists - this allows API calls to work
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  // Always start with empty user data - it will be fetched from API via refreshUser()
  // Always start with isRefreshing: true on initial load to prevent premature redirects
  // This ensures PrivateRoute waits for refresh to complete, even if token is in IndexedDB
  return {
    user: { name: null, email: null },
    token: token,
    isLoggedIn: false, // Will be set to true after successful API refresh
    isRefreshing: true, // Always start refreshing on initial load (prevents premature redirect)
    error: null,
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isLoggedIn = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isLoggedIn = true;
        // Token is already saved in the thunk via setAuthHeader
        // User data comes from API - no need to save to IndexedDB
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.error = null;
        // Set isRefreshing to false during login to prevent refresh interference
        state.isRefreshing = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isLoggedIn = true;
        // Token is already saved in the thunk via setAuthHeader
        // User data comes from API - no need to save to IndexedDB
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.payload;
        // Clear any existing token if login fails (user might have wrong credentials)
        // This prevents using stale tokens from previous sessions
        if (action.payload?.status === 400 || action.payload?.status === 401) {
          state.token = null;
          state.isLoggedIn = false;
          // Clear token from storage as well
          setAuthHeader(null).catch(err => {
            if (process.env.NODE_ENV === 'development') {
              console.error('Error clearing token after failed login:', err);
            }
          });
        }
      })
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = { name: null, email: null };
        state.token = null;
        state.isLoggedIn = false;
        state.error = null;
        // Token is already removed in the thunk via setAuthHeader
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if logout API call fails, clear local state
        // This ensures user is logged out locally even if server call fails
        state.user = { name: null, email: null };
        state.token = null;
        state.isLoggedIn = false;
        state.error = null;
        // Token is already removed in the thunk via setAuthHeader
      })
      // Refresh
      .addCase(refreshUser.pending, (state) => {
        state.isRefreshing = true;
        state.error = null;
      })
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isLoggedIn = true;
        state.isRefreshing = false;
        // Ensure token is set in state if it was loaded from localStorage
        if (!state.token) {
          const token = getTokenFromStorage();
          if (token) {
            state.token = token;
          }
        }
        // User data is restored from API - no need to save to IndexedDB
      })
      .addCase(refreshUser.rejected, (state, action) => {
        state.isRefreshing = false;
        // Only clear auth state if token is invalid, not for network errors
        const errorMessage = action.payload?.message || '';
        if (errorMessage.includes('Invalid') || errorMessage.includes('expired') || errorMessage.includes('No token')) {
          // Clear auth state only for invalid/expired tokens
          state.user = { name: null, email: null };
          state.token = null;
          state.isLoggedIn = false;
          // Token is already removed in the thunk via setAuthHeader
        }
        // For network errors, keep the token and let user stay logged in
      })
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isLoggedIn = true;
        // User data is updated from API - no need to save to IndexedDB
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { setCredentials } = authSlice.actions;
export default authSlice.reducer;