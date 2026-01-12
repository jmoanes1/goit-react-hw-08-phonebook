import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { mockFetchContacts, mockAddContact, mockDeleteContact } from '../services/mockApi';
import { dbGetToken } from '../services/db';

// Backend API endpoint
const BASE_URL = 'https://connections-api.goit.global';

// Utility to ensure auth token is set in axios headers
// This ensures JWT token is attached to all API requests
// The token is retrieved from IndexedDB and set in axios default headers
const ensureAuthHeader = async () => {
  try {
    const token = await dbGetToken();
    if (token) {
      // Set Authorization header for all axios requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return true;
    }
    // Clear Authorization header if no token exists
    delete axios.defaults.headers.common['Authorization'];
    return false;
  } catch (error) {
    // Only log in development to reduce console noise in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting token from IndexedDB:', error);
    }
    // Fallback to localStorage for synchronous access
    const token = localStorage.getItem('auth_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return true;
    }
    delete axios.defaults.headers.common['Authorization'];
    return false;
  }
};

// Check if we should use mock API (also check localStorage as a fallback)
// Mock API is only used as a fallback when network errors occur
// It can be explicitly enabled via environment variable or localStorage for testing
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
  
  // By default, use real API - mock API will be used automatically as fallback on network errors
  return false;
};

// ===== ASYNC THUNKS FOR API CALLS ===== //
export const fetchContacts = createAsyncThunk('contacts/fetchContacts', async (_, { rejectWithValue, getState }) => {
  // Ensure auth token is set before making the request
  if (!(await ensureAuthHeader())) {
    const errorMessage = 'Authentication required. Please log in again.';
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      if (process.env.NODE_ENV === 'development') {
        console.error('fetchContacts: No auth token found');
      }
    }
    return rejectWithValue(errorMessage);
  }

  try {
    const response = await axios.get(`${BASE_URL}/contacts`);
    // Only log success in development
    if (process.env.NODE_ENV === 'development') {
      if (process.env.NODE_ENV === 'development') {
        console.log('fetchContacts: Successfully fetched contacts from API');
      }
    }
    // API is the source of truth - no need to sync to IndexedDB
    return response.data;
  } catch (error) {
    // Log the error for debugging only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('fetchContacts API Error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }

    // Handle authentication errors specifically
    if (error.response?.status === 401) {
      const errorMessage = 'Authentication failed. Please log in again.';
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('fetchContacts: 401 Unauthorized - token may be invalid');
      }
      return rejectWithValue(errorMessage);
    }

    // Check if this is a network error (no response from server)
    const isNetworkError = error.request || 
                          error.message === 'Network Error' || 
                          error.code === 'ERR_NETWORK' ||
                          error.code === 'ECONNABORTED' ||
                          !error.response;

    // Automatically use mock API as fallback for network errors
    if (isNetworkError) {
      // Only log in development to reduce console noise in production
      if (process.env.NODE_ENV === 'development') {
        console.warn('fetchContacts: Real API unreachable, using IndexedDB mock API as fallback');
      }
      try {
        const mockResponse = await mockFetchContacts();
        return mockResponse.data;
      } catch (mockError) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.error('fetchContacts: Mock API also failed', mockError);
        }
        return rejectWithValue(error.message || 'Failed to fetch contacts');
      }
    }

    // For other server errors (not network errors), return the error
    // Don't use mock API for server errors - these are real API responses
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch contacts';
    return rejectWithValue(errorMessage);
  }
});

export const addContact = createAsyncThunk('contacts/addContact', async (contact, { rejectWithValue }) => {
  // Ensure auth token is set before making the request
  if (!(await ensureAuthHeader())) {
    const errorMessage = 'Authentication required. Please log in again.';
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      if (process.env.NODE_ENV === 'development') {
        console.error('addContact: No auth token found');
      }
    }
    return rejectWithValue(errorMessage);
  }

  try {
    const response = await axios.post(`${BASE_URL}/contacts`, contact);
    // Only log success in development
    if (process.env.NODE_ENV === 'development') {
      if (process.env.NODE_ENV === 'development') {
        console.log('addContact: Successfully added contact to API', response.data);
      }
    }
    // API is the source of truth - no need to save to IndexedDB
    return response.data;
  } catch (error) {
    // Log the error for debugging only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('addContact API Error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }

    // Handle authentication errors specifically
    if (error.response?.status === 401) {
      const errorMessage = 'Authentication failed. Please log in again.';
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('addContact: 401 Unauthorized - token may be invalid');
      }
      return rejectWithValue(errorMessage);
    }

    // Handle validation errors (e.g., duplicate contact)
    if (error.response?.status === 400 || error.response?.status === 409) {
      const errorMessage = error.response?.data?.message || 'Invalid contact data';
      return rejectWithValue(errorMessage);
    }

    // Check if this is a network error (no response from server)
    const isNetworkError = error.request || 
                          error.message === 'Network Error' || 
                          error.code === 'ERR_NETWORK' ||
                          error.code === 'ECONNABORTED' ||
                          !error.response;

    // Automatically use mock API as fallback for network errors
    if (isNetworkError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('addContact: Real API unreachable, using IndexedDB mock API as fallback');
      }
      try {
        const mockResponse = await mockAddContact(contact);
        return mockResponse.data;
      } catch (mockError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('addContact: Mock API also failed', mockError);
        }
        return rejectWithValue(error.message || 'Failed to add contact');
      }
    }

    // For other server errors (not network errors), return the error
    // Don't use mock API for server errors - these are real API responses
    const errorMessage = error.response?.data?.message || error.message || 'Failed to add contact';
    return rejectWithValue(errorMessage);
  }
});

export const deleteContact = createAsyncThunk('contacts/deleteContact', async (id, { rejectWithValue }) => {
  // Ensure auth token is set before making the request
  if (!(await ensureAuthHeader())) {
    const errorMessage = 'Authentication required. Please log in again.';
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      if (process.env.NODE_ENV === 'development') {
        console.error('deleteContact: No auth token found');
      }
    }
    return rejectWithValue(errorMessage);
  }

  try {
    await axios.delete(`${BASE_URL}/contacts/${id}`);
    // Only log success in development
    if (process.env.NODE_ENV === 'development') {
      if (process.env.NODE_ENV === 'development') {
        console.log('deleteContact: Successfully deleted contact from API', id);
      }
    }
    // API is the source of truth - no need to delete from IndexedDB
    return id;
  } catch (error) {
    // Log the error for debugging only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('deleteContact API Error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }

    // Handle authentication errors specifically
    if (error.response?.status === 401) {
      const errorMessage = 'Authentication failed. Please log in again.';
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('deleteContact: 401 Unauthorized - token may be invalid');
      }
      return rejectWithValue(errorMessage);
    }

    // Handle not found errors
    if (error.response?.status === 404) {
      const errorMessage = 'Contact not found';
      return rejectWithValue(errorMessage);
    }

    // Check if this is a network error (no response from server)
    const isNetworkError = error.request || 
                          error.message === 'Network Error' || 
                          error.code === 'ERR_NETWORK' ||
                          error.code === 'ECONNABORTED' ||
                          !error.response;

    // Automatically use mock API as fallback for network errors
    if (isNetworkError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('deleteContact: Real API unreachable, using IndexedDB mock API as fallback');
      }
      try {
        const mockResponse = await mockDeleteContact(id);
        return mockResponse.data;
      } catch (mockError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('deleteContact: Mock API also failed', mockError);
        }
        return rejectWithValue(error.message || 'Failed to delete contact');
      }
    }

    // For other server errors (not network errors), return the error
    // Don't use mock API for server errors - these are real API responses
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete contact';
    return rejectWithValue(errorMessage);
  }
});

const contactsSlice = createSlice({
  name: 'contacts',
  initialState: {
    items: [],
    filter: '',
    status: 'idle', 
    error: null,
  },
  reducers: {
    updateFilter: (state, action) => {
      state.filter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch contacts
      .addCase(fetchContacts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Add contact
      .addCase(addContact.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(addContact.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items.push(action.payload);
      })
      .addCase(addContact.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Delete contact
      .addCase(deleteContact.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      .addCase(deleteContact.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { updateFilter } = contactsSlice.actions;
export default contactsSlice.reducer;
