import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { mockFetchContacts, mockAddContact, mockDeleteContact } from '../services/mockApi';

// Backend API endpoint
const BASE_URL = 'https://connections-api.herokuapp.com';

// ===== ASYNC THUNKS FOR API CALLS ===== //
export const fetchContacts = createAsyncThunk('contacts/fetchContacts', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${BASE_URL}/contacts`);
    return response.data;
  } catch (error) {
    // Try mock API as fallback
    try {
      const mockResponse = await mockFetchContacts();
      return mockResponse.data;
    } catch (mockError) {
      return rejectWithValue(error.message);
    }
  }
});

export const addContact = createAsyncThunk('contacts/addContact', async (contact, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${BASE_URL}/contacts`, contact);
    return response.data;
  } catch (error) {
    // Try mock API as fallback
    try {
      const mockResponse = await mockAddContact(contact);
      return mockResponse.data;
    } catch (mockError) {
      return rejectWithValue(error.message);
    }
  }
});

export const deleteContact = createAsyncThunk('contacts/deleteContact', async (id, { rejectWithValue }) => {
  try {
    await axios.delete(`${BASE_URL}/contacts/${id}`);
    return id;
  } catch (error) {
    // Try mock API as fallback
    try {
      const mockResponse = await mockDeleteContact(id);
      return mockResponse.data;
    } catch (mockError) {
      return rejectWithValue(error.message);
    }
  }
});

const contactsSlice = createSlice({
  name: 'contacts',
  initialState: {
    items: [],
    filter: '',
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
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
