// Mock API service for testing when the real backend is not available
// Uses IndexedDB as primary database with localStorage as backup
import {
  dbGetUsers,
  dbAddUser,
  dbUpdateUser,
  dbFindUserByEmail,
  dbFindUserByToken,
  dbGetContacts,
  dbAddContact,
  dbDeleteContact
} from './db';

export const mockRegisterUser = (userData) => {
  return new Promise(async (resolve, reject) => {
    // Simulate network delay
    setTimeout(async () => {
      try {
        // Check if user already exists using database
        const existingUser = await dbFindUserByEmail(userData.email);
        if (existingUser) {
          reject({
            response: {
              status: 409,
              data: {
                message: 'User with this email already exists'
              }
            }
          });
          return;
        }
        
        // Create new user
        const newUser = {
          id: Date.now().toString(),
          name: userData.name,
          email: userData.email,
          token: `mock-jwt-token-${Date.now()}`
        };
        
        // Save to database (which also syncs to localStorage)
        await dbAddUser(newUser);
        
        resolve({
          data: {
            user: {
              id: newUser.id,
              name: newUser.name,
              email: newUser.email
            },
            token: newUser.token
          }
        });
      } catch (error) {
        console.error('Error in mockRegisterUser:', error);
        reject({
          response: {
            status: 500,
            data: {
              message: 'Failed to register user'
            }
          }
        });
      }
    }, 500);
  });
};

export const mockLoginUser = (userData) => {
  return new Promise(async (resolve, reject) => {
    // Simulate network delay
    setTimeout(async () => {
      try {
        // Find user by email using database
        const user = await dbFindUserByEmail(userData.email);
        if (!user) {
          reject({
            response: {
              status: 401,
              data: {
                message: 'Invalid email or password'
              }
            }
          });
          return;
        }
        
        // For simplicity, we're not checking the password in mock
        // In a real implementation, you would validate the password
        
        resolve({
          data: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email
            },
            token: user.token
          }
        });
      } catch (error) {
        console.error('Error in mockLoginUser:', error);
        reject({
          response: {
            status: 500,
            data: {
              message: 'Failed to login user'
            }
          }
        });
      }
    }, 500);
  });
};

export const mockFetchContacts = () => {
  return new Promise(async (resolve) => {
    // Simulate network delay
    setTimeout(async () => {
      try {
        // Get contacts from database (which also syncs to localStorage)
        const contacts = await dbGetContacts();
        resolve({
          data: contacts
        });
      } catch (error) {
        console.error('Error in mockFetchContacts:', error);
        resolve({
          data: []
        });
      }
    }, 300);
  });
};

export const mockAddContact = (contactData) => {
  return new Promise(async (resolve) => {
    // Simulate network delay
    setTimeout(async () => {
      try {
        const newContact = {
          id: Date.now().toString(),
          name: contactData.name,
          number: contactData.number
        };
        
        // Save to database (which also syncs to localStorage)
        await dbAddContact(newContact);
        
        resolve({
          data: newContact
        });
      } catch (error) {
        console.error('Error in mockAddContact:', error);
        resolve({
          data: null
        });
      }
    }, 300);
  });
};

export const mockDeleteContact = (id) => {
  return new Promise(async (resolve, reject) => {
    // Simulate network delay
    setTimeout(async () => {
      try {
        // Check if contact exists before deleting
        const contacts = await dbGetContacts();
        const contactExists = contacts.some(c => c.id === id);
        
        if (!contactExists) {
          reject({
            response: {
              status: 404,
              data: {
                message: 'Contact not found'
              }
            }
          });
          return;
        }
        
        // Delete from database (which also syncs to localStorage)
        await dbDeleteContact(id);
        
        resolve({
          data: id
        });
      } catch (error) {
        console.error('Error in mockDeleteContact:', error);
        reject({
          response: {
            status: 500,
            data: {
              message: 'Failed to delete contact'
            }
          }
        });
      }
    }, 300);
  });
};

// Mock refresh user - get current user by token
export const mockRefreshUser = (token) => {
  return new Promise(async (resolve, reject) => {
    // Simulate network delay
    setTimeout(async () => {
      try {
        // Find user by token using database
        const user = await dbFindUserByToken(token);
        if (!user) {
          reject({
            response: {
              status: 401,
              data: {
                message: 'Invalid or expired token'
              }
            }
          });
          return;
        }
        
        resolve({
          data: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        });
      } catch (error) {
        console.error('Error in mockRefreshUser:', error);
        reject({
          response: {
            status: 500,
            data: {
              message: 'Failed to refresh user'
            }
          }
        });
      }
    }, 300);
  });
};

// Mock update user - update user information by token
export const mockUpdateUser = (token, userData) => {
  return new Promise(async (resolve, reject) => {
    // Simulate network delay
    setTimeout(async () => {
      try {
        // Find user by token using database
        const user = await dbFindUserByToken(token);
        if (!user) {
          reject({
            response: {
              status: 401,
              data: {
                message: 'Invalid or expired token'
              }
            }
          });
          return;
        }
        
        // Update user data
        if (userData.name) user.name = userData.name;
        if (userData.email) {
          // Check if email is already taken by another user
          const existingUser = await dbFindUserByEmail(userData.email);
          if (existingUser && existingUser.id !== user.id) {
            reject({
              response: {
                status: 409,
                data: {
                  message: 'Email already in use'
                }
              }
            });
            return;
          }
          user.email = userData.email;
        }
        // Note: We don't store passwords in mock, so password updates are ignored
        
        // Save updated user to database (which also syncs to localStorage)
        await dbUpdateUser(user);
        
        resolve({
          data: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        });
      } catch (error) {
        console.error('Error in mockUpdateUser:', error);
        reject({
          response: {
            status: 500,
            data: {
              message: 'Failed to update user'
            }
          }
        });
      }
    }, 300);
  });
};