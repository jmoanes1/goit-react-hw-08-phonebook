// Mock API service for testing when the real backend is not available
// Load users from localStorage or initialize empty array
const getMockUsers = () => {
  try {
    const stored = localStorage.getItem('mock_users');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading mock users:', error);
    return [];
  }
};

const saveMockUsers = (users) => {
  try {
    localStorage.setItem('mock_users', JSON.stringify(users));
  } catch (error) {
    console.error('Error saving mock users:', error);
  }
};

let mockUsers = getMockUsers();

export const mockRegisterUser = (userData) => {
  return new Promise((resolve, reject) => {
    // Simulate network delay
    setTimeout(() => {
      // Check if user already exists
      const existingUser = mockUsers.find(user => user.email === userData.email);
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
      
      mockUsers.push(newUser);
      saveMockUsers(mockUsers);
      
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
    }, 500);
  });
};

export const mockLoginUser = (userData) => {
  return new Promise((resolve, reject) => {
    // Simulate network delay
    setTimeout(() => {
      // Find user by email
      const user = mockUsers.find(user => user.email === userData.email);
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
    }, 500);
  });
};

// Load contacts from localStorage or initialize empty array
const getMockContacts = () => {
  try {
    const stored = localStorage.getItem('mock_contacts');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading mock contacts:', error);
    return [];
  }
};

const saveMockContacts = (contacts) => {
  try {
    localStorage.setItem('mock_contacts', JSON.stringify(contacts));
  } catch (error) {
    console.error('Error saving mock contacts:', error);
  }
};

let mockContacts = getMockContacts();

export const mockFetchContacts = () => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      // Reload contacts from localStorage in case they were updated
      mockContacts = getMockContacts();
      resolve({
        data: mockContacts
      });
    }, 300);
  });
};

export const mockAddContact = (contactData) => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      // Reload contacts from localStorage
      mockContacts = getMockContacts();
      
      const newContact = {
        id: Date.now().toString(),
        name: contactData.name,
        number: contactData.number
      };
      
      mockContacts.push(newContact);
      saveMockContacts(mockContacts);
      
      resolve({
        data: newContact
      });
    }, 300);
  });
};

export const mockDeleteContact = (id) => {
  return new Promise((resolve, reject) => {
    // Simulate network delay
    setTimeout(() => {
      // Reload contacts from localStorage
      mockContacts = getMockContacts();
      
      const contactIndex = mockContacts.findIndex(c => c.id === id);
      if (contactIndex === -1) {
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
      
      // Remove contact
      mockContacts.splice(contactIndex, 1);
      saveMockContacts(mockContacts);
      
      resolve({
        data: id
      });
    }, 300);
  });
};

// Mock refresh user - get current user by token
export const mockRefreshUser = (token) => {
  return new Promise((resolve, reject) => {
    // Simulate network delay
    setTimeout(() => {
      // Reload users from localStorage in case they were updated
      mockUsers = getMockUsers();
      
      // Find user by token
      const user = mockUsers.find(u => u.token === token);
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
    }, 300);
  });
};

// Mock update user - update user information by token
export const mockUpdateUser = (token, userData) => {
  return new Promise((resolve, reject) => {
    // Simulate network delay
    setTimeout(() => {
      // Reload users from localStorage
      mockUsers = getMockUsers();
      
      // Find user by token
      const userIndex = mockUsers.findIndex(u => u.token === token);
      if (userIndex === -1) {
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
      const user = mockUsers[userIndex];
      if (userData.name) user.name = userData.name;
      if (userData.email) {
        // Check if email is already taken by another user
        const emailExists = mockUsers.some((u, index) => 
          u.email === userData.email && index !== userIndex
        );
        if (emailExists) {
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
      
      // Save updated users
      mockUsers[userIndex] = user;
      saveMockUsers(mockUsers);
      
      resolve({
        data: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });
    }, 300);
  });
};