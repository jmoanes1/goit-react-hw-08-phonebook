# GoIT Connections API Service

A clean, modular API wrapper for the GoIT Connections API at `https://connections-api.goit.global`.

## Features

- ✅ JWT authentication (signup, login, logout)
- ✅ Automatic token management with localStorage
- ✅ Full CRUD operations for contacts
- ✅ Axios interceptors for automatic token attachment
- ✅ Error handling and token expiration management

## Installation

The service uses `axios` which should already be installed in your project:

```bash
npm install axios
```

## Usage

### Basic Setup

```javascript
import { authAPI, contactsAPI, tokenService } from './services/api';

// Check if user is authenticated
if (tokenService.isAuthenticated()) {
  console.log('User is logged in');
}
```

### Authentication

#### Sign Up

```javascript
import { authAPI } from './services/api';

const handleSignup = async () => {
  try {
    const response = await authAPI.signup({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    });
    
    // Token is automatically saved to localStorage
    console.log('User:', response.user);
    console.log('Token:', response.token);
  } catch (error) {
    console.error('Signup failed:', error.response?.data?.message);
  }
};
```

#### Login

```javascript
import { authAPI } from './services/api';

const handleLogin = async () => {
  try {
    const response = await authAPI.login({
      email: 'john@example.com',
      password: 'password123'
    });
    
    // Token is automatically saved to localStorage
    console.log('User:', response.user);
  } catch (error) {
    console.error('Login failed:', error.response?.data?.message);
  }
};
```

#### Logout

```javascript
import { authAPI } from './services/api';

const handleLogout = async () => {
  try {
    await authAPI.logout();
    // Token is automatically removed from localStorage
    console.log('Logged out successfully');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
```

#### Get Current User

```javascript
import { authAPI } from './services/api';

const getCurrentUser = async () => {
  try {
    const user = await authAPI.getCurrentUser();
    console.log('Current user:', user);
  } catch (error) {
    console.error('Failed to get user:', error.response?.data?.message);
  }
};
```

#### Update User

```javascript
import { authAPI } from './services/api';

const updateUser = async () => {
  try {
    const updatedUser = await authAPI.updateUser({
      name: 'Jane Doe',
      email: 'jane@example.com'
    });
    console.log('User updated:', updatedUser);
  } catch (error) {
    console.error('Update failed:', error.response?.data?.message);
  }
};
```

### Contacts CRUD Operations

#### Get All Contacts

```javascript
import { contactsAPI } from './services/api';

const fetchContacts = async () => {
  try {
    const contacts = await contactsAPI.getAll();
    console.log('Contacts:', contacts);
  } catch (error) {
    console.error('Failed to fetch contacts:', error.response?.data?.message);
  }
};
```

#### Get Single Contact

```javascript
import { contactsAPI } from './services/api';

const fetchContact = async (contactId) => {
  try {
    const contact = await contactsAPI.getById(contactId);
    console.log('Contact:', contact);
  } catch (error) {
    console.error('Failed to fetch contact:', error.response?.data?.message);
  }
};
```

#### Add Contact

```javascript
import { contactsAPI } from './services/api';

const addContact = async () => {
  try {
    const newContact = await contactsAPI.add({
      name: 'John Doe',
      number: '123-456-7890'
    });
    console.log('Contact added:', newContact);
  } catch (error) {
    console.error('Failed to add contact:', error.response?.data?.message);
  }
};
```

#### Update Contact

```javascript
import { contactsAPI } from './services/api';

const updateContact = async (contactId) => {
  try {
    const updatedContact = await contactsAPI.update(contactId, {
      name: 'Jane Doe',
      number: '987-654-3210'
    });
    console.log('Contact updated:', updatedContact);
  } catch (error) {
    console.error('Failed to update contact:', error.response?.data?.message);
  }
};
```

#### Delete Contact

```javascript
import { contactsAPI } from './services/api';

const deleteContact = async (contactId) => {
  try {
    await contactsAPI.delete(contactId);
    console.log('Contact deleted successfully');
  } catch (error) {
    console.error('Failed to delete contact:', error.response?.data?.message);
  }
};
```

## Token Management

The service automatically manages JWT tokens:

- **Storage**: Tokens are stored in `localStorage` under the key `auth_token`
- **Automatic Attachment**: Tokens are automatically attached to all API requests via axios interceptors
- **Expiration Handling**: On 401 errors, the token is automatically removed

### Manual Token Management

```javascript
import { tokenService } from './services/api';

// Get token
const token = tokenService.get();

// Set token (usually done automatically by authAPI)
tokenService.set('your-jwt-token');

// Remove token (usually done automatically by authAPI.logout())
tokenService.remove();

// Check if authenticated
if (tokenService.isAuthenticated()) {
  console.log('User is authenticated');
}
```

## Error Handling

All API methods throw errors that can be caught and handled:

```javascript
try {
  const contacts = await contactsAPI.getAll();
} catch (error) {
  // Check if it's an API error with response
  if (error.response) {
    console.error('API Error:', error.response.status);
    console.error('Message:', error.response.data?.message);
  } else {
    console.error('Network Error:', error.message);
  }
}
```

## Example Components

See the example components in `src/components/examples/`:

- `AuthExample.jsx` - Authentication example
- `ContactsListExample.jsx` - List all contacts
- `AddContactExample.jsx` - Add new contact
- `UpdateContactExample.jsx` - Update existing contact
- `DeleteContactExample.jsx` - Delete contact
- `CompleteExample.jsx` - Full CRUD app example

## API Endpoints

The service uses the following endpoints:

### Authentication
- `POST /users/signup` - Register new user
- `POST /users/login` - Login user
- `POST /users/logout` - Logout user
- `GET /users/current` - Get current user
- `PATCH /users` - Update user

### Contacts
- `GET /contacts` - Get all contacts
- `GET /contacts/:id` - Get single contact
- `POST /contacts` - Add new contact
- `PATCH /contacts/:id` - Update contact
- `DELETE /contacts/:id` - Delete contact

## Notes

- All API requests automatically include the JWT token in the `Authorization` header
- The token is stored in `localStorage` for persistence across page reloads
- On 401 errors, the token is automatically removed and you should redirect to login

