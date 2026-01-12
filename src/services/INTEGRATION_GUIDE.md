# Integration Guide: Using the API Service with Redux

This guide shows how to integrate the new clean API service (`api.js`) with your existing Redux setup.

## Option 1: Use API Service Directly in Components (Recommended for New Code)

You can use the API service directly in your React components without Redux:

```javascript
import { contactsAPI } from '../services/api';

function MyComponent() {
  const [contacts, setContacts] = useState([]);
  
  useEffect(() => {
    contactsAPI.getAll().then(setContacts);
  }, []);
  
  // ... rest of component
}
```

## Option 2: Update Redux Slices to Use API Service

You can update your Redux slices to use the new API service instead of direct axios calls.

### Update `authSlice.js`

Replace the direct axios calls with the API service:

```javascript
import { authAPI } from '../services/api';

// Replace the registerUser thunk:
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.signup(userData);
      return response;
    } catch (error) {
      return rejectWithValue({
        status: error.response?.status,
        message: error.response?.data?.message || 'Registration failed',
      });
    }
  }
);

// Similar updates for loginUser, logoutUser, refreshUser, updateUser
```

### Update `contactsSlice.js`

Replace the direct axios calls with the API service:

```javascript
import { contactsAPI } from '../services/api';

// Replace the fetchContacts thunk:
export const fetchContacts = createAsyncThunk(
  'contacts/fetchContacts',
  async (_, { rejectWithValue }) => {
    try {
      const contacts = await contactsAPI.getAll();
      return contacts;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch contacts'
      );
    }
  }
);

// Similar updates for addContact, deleteContact
```

### Simplified Token Management

Since the API service handles token storage automatically, you can simplify your Redux slices:

```javascript
// Remove these functions from authSlice.js:
// - setAuthHeader (tokenService handles this)
// - getTokenFromStorage (use tokenService.get() instead)
// - getTokenFromStorageAsync (use tokenService.get() instead)

// In getInitialState:
import { tokenService } from '../services/api';

const getInitialState = () => {
  const token = tokenService.get();
  if (token) {
    // Token is already set in axios headers by the API service
  }
  return {
    user: { name: null, email: null },
    token: token,
    isLoggedIn: false,
    isRefreshing: false,
    error: null,
  };
};
```

## Option 3: Hybrid Approach

Keep your existing Redux setup but use the API service for new features:

- Use Redux for existing components
- Use the API service directly for new components
- Gradually migrate to the API service

## Benefits of Using the API Service

1. **Cleaner Code**: No need to manage axios headers manually
2. **Automatic Token Management**: Tokens are automatically saved/loaded
3. **Better Error Handling**: Consistent error handling across the app
4. **Easier Testing**: Mock the API service instead of axios
5. **Type Safety**: Easier to add TypeScript types later

## Migration Steps

1. **Keep existing code working**: Don't break current functionality
2. **Test the API service**: Use it in new components first
3. **Gradually migrate**: Update Redux slices one at a time
4. **Remove old code**: Once everything uses the API service, remove duplicate code

## Example: Migrated Redux Slice

Here's a complete example of a migrated contacts slice:

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { contactsAPI } from '../services/api';

// Fetch contacts
export const fetchContacts = createAsyncThunk(
  'contacts/fetchContacts',
  async (_, { rejectWithValue }) => {
    try {
      return await contactsAPI.getAll();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch contacts'
      );
    }
  }
);

// Add contact
export const addContact = createAsyncThunk(
  'contacts/addContact',
  async (contact, { rejectWithValue }) => {
    try {
      return await contactsAPI.add(contact);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add contact'
      );
    }
  }
);

// Delete contact
export const deleteContact = createAsyncThunk(
  'contacts/deleteContact',
  async (id, { rejectWithValue }) => {
    try {
      await contactsAPI.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete contact'
      );
    }
  }
);

// Update contact
export const updateContact = createAsyncThunk(
  'contacts/updateContact',
  async ({ id, ...contactData }, { rejectWithValue }) => {
    try {
      return await contactsAPI.update(id, contactData);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update contact'
      );
    }
  }
);

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
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      .addCase(updateContact.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export const { updateFilter } = contactsSlice.actions;
export default contactsSlice.reducer;
```

