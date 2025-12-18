import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { mockRegisterUser, mockLoginUser, mockRefreshUser, mockUpdateUser } from '../services/mockApi';

// Set the base URL for the backend API
const BASE_URL = 'https://connections-api.herokuapp.com';

// Token storage key for localStorage
const TOKEN_KEY = 'auth_token';

// Utility to save token to localStorage and set axios header
const setAuthHeader = (token) => {
  if (token) {
    // Save token to localStorage
    localStorage.setItem(TOKEN_KEY, token);
    // Set axios default header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    // Remove token from localStorage
    localStorage.removeItem(TOKEN_KEY);
    // Remove axios default header
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Utility to get token from localStorage
const getTokenFromStorage = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Register user
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/users/signup`, userData);
      setAuthHeader(response.data.token);
      return response.data;
    } catch (error) {
      console.error('Registration API Error:', error);
      // Try mock API as fallback when real API fails
      try {
        const mockResponse = await mockRegisterUser(userData);
        setAuthHeader(mockResponse.data.token);
        return mockResponse.data;
      } catch (mockError) {
        // Prioritize mock error message (usually validation errors)
        // Check mock error first
        if (mockError.response) {
          return rejectWithValue({
            status: mockError.response.status,
            message: mockError.response.data?.message || 'Registration failed',
            data: mockError.response.data
          });
        }
        // Then check original error
        if (error.response) {
          // Server responded with error status
          return rejectWithValue({
            status: error.response.status,
            message: error.response.data?.message || 'Registration failed',
            data: error.response.data
          });
        } else if (error.request) {
          // Request was made but no response received - use mock as fallback
          // If we reach here, mock also failed, so show a helpful message
          return rejectWithValue({
            message: mockError.message || 'Registration failed. Please try again.',
            networkError: false
          });
        } else {
          // Something else happened
          return rejectWithValue({
            message: mockError.message || error.message || 'Registration failed due to unexpected error'
          });
        }
      }
    }
  }
);

// Login user
export const loginUser = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/users/login`, userData);
      setAuthHeader(response.data.token);
      return response.data;
    } catch (error) {
      console.error('Login API Error:', error);
      // Try mock API as fallback when real API fails
      try {
        const mockResponse = await mockLoginUser(userData);
        setAuthHeader(mockResponse.data.token);
        return mockResponse.data;
      } catch (mockError) {
        // Prioritize mock error message (usually validation errors)
        // Check mock error first
        if (mockError.response) {
          return rejectWithValue({
            status: mockError.response.status,
            message: mockError.response.data?.message || 'Login failed',
            data: mockError.response.data
          });
        }
        // Then check original error
        if (error.response) {
          // Server responded with error status
          return rejectWithValue({
            status: error.response.status,
            message: error.response.data?.message || 'Login failed',
            data: error.response.data
          });
        } else if (error.request) {
          // Request was made but no response received - use mock as fallback
          // If we reach here, mock also failed, so show a helpful message
          return rejectWithValue({
            message: mockError.message || 'Login failed. Please check your credentials and try again.',
            networkError: false
          });
        } else {
          // Something else happened
          return rejectWithValue({
            message: mockError.message || error.message || 'Login failed due to unexpected error'
          });
        }
      }
    }
  }
);

// Logout user
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Try to call logout API endpoint
      await axios.post(`${BASE_URL}/users/logout`);
    } catch (error) {
      // Even if API call fails, we should still log out locally
      // This handles cases where the API is down or network fails
      console.warn('Logout API call failed, but clearing local session:', error);
    } finally {
      // Always clear token and auth header, regardless of API call result
      setAuthHeader(null);
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
      // Get token from state or localStorage (in case state was lost on refresh)
      const token = auth.token || getTokenFromStorage();
      if (!token) {
        // No token available, user is not logged in
        return rejectWithValue({ message: 'No token available' });
      }
      setAuthHeader(token);
      try {
        const response = await axios.get(`${BASE_URL}/users/current`);
        return response.data;
      } catch (error) {
        // If real API fails, try mock API as fallback
        console.log('Refresh API Error, trying mock API:', error);
        try {
          const mockResponse = await mockRefreshUser(token);
          return mockResponse.data;
        } catch (mockError) {
          // If mock also fails, only clear token if it's an authentication error
          // Don't clear token for network errors - user might still be valid
          if (mockError.response && mockError.response.status === 401) {
            // Invalid token, clear it
            setAuthHeader(null);
            return rejectWithValue({ message: 'Invalid or expired token' });
          }
          // For other errors, don't clear token - might be temporary network issue
          return rejectWithValue({ message: 'Failed to refresh user. Please try again.' });
        }
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
      const token = auth.token || getTokenFromStorage();
      if (!token) {
        return rejectWithValue({ message: 'No token available. Please log in again.' });
      }
      setAuthHeader(token);
      try {
        const response = await axios.patch(`${BASE_URL}/users`, userData);
        return response.data;
      } catch (error) {
        // If real API fails, try mock API as fallback
        console.log('Update API Error, trying mock API:', error);
        try {
          const mockResponse = await mockUpdateUser(token, userData);
          return mockResponse.data;
        } catch (mockError) {
          // Handle mock error
          if (mockError.response) {
            return rejectWithValue({
              status: mockError.response.status,
              message: mockError.response.data?.message || 'Update failed',
              data: mockError.response.data
            });
          }
          // Handle original error
          if (error.response) {
            return rejectWithValue({
              status: error.response.status,
              message: error.response.data?.message || 'Update failed',
              data: error.response.data
            });
          } else if (error.request) {
            return rejectWithValue({
              message: mockError.message || 'Update failed. Please try again.',
              networkError: false
            });
          } else {
            return rejectWithValue({
              message: mockError.message || error.message || 'Update failed due to unexpected error'
            });
          }
        }
      }
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Update failed due to unexpected error'
      });
    }
  }
);

// Initialize state from localStorage if token exists
const getInitialState = () => {
  const token = getTokenFromStorage();
  if (token) {
    // Set axios header if token exists
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // Try to get user data from localStorage if available
    try {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return {
          user: user,
          token: token,
          isLoggedIn: true, // Set to true if token exists (will be validated by refreshUser)
          isRefreshing: false,
          error: null,
        };
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
    }
  }
  return {
    user: { name: null, email: null },
    token: token,
    isLoggedIn: token ? true : false, // Set to true if token exists (will be validated by refreshUser)
    isRefreshing: false,
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
        // Save token to localStorage
        setAuthHeader(action.payload.token);
        // Save user data to localStorage for quick restoration
        try {
          localStorage.setItem('auth_user', JSON.stringify(action.payload.user));
        } catch (error) {
          console.error('Error saving user to localStorage:', error);
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isLoggedIn = true;
        // Save token to localStorage
        setAuthHeader(action.payload.token);
        // Save user data to localStorage for quick restoration
        try {
          localStorage.setItem('auth_user', JSON.stringify(action.payload.user));
        } catch (error) {
          console.error('Error saving user to localStorage:', error);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.payload;
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
        // Remove user data from localStorage
        try {
          localStorage.removeItem('auth_user');
        } catch (error) {
          console.error('Error removing user from localStorage:', error);
        }
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if logout API call fails, clear local state
        // This ensures user is logged out locally even if server call fails
        state.user = { name: null, email: null };
        state.token = null;
        state.isLoggedIn = false;
        state.error = null;
        // Remove user data from localStorage
        try {
          localStorage.removeItem('auth_user');
        } catch (error) {
          console.error('Error removing user from localStorage:', error);
        }
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
        // Save user data to localStorage for quick restoration
        try {
          localStorage.setItem('auth_user', JSON.stringify(action.payload));
        } catch (error) {
          console.error('Error saving user to localStorage:', error);
        }
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
          // Remove user data from localStorage
          try {
            localStorage.removeItem('auth_user');
          } catch (error) {
            console.error('Error removing user from localStorage:', error);
          }
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
        // Save updated user data to localStorage
        try {
          localStorage.setItem('auth_user', JSON.stringify(action.payload));
        } catch (error) {
          console.error('Error saving user to localStorage:', error);
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { setCredentials } = authSlice.actions;
export default authSlice.reducer;