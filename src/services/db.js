// IndexedDB database service
// Provides database operations using IndexedDB with localStorage as backup

const DB_NAME = 'PhonebookDB';
const DB_VERSION = 1;

// Store names
export const STORES = {
  USERS: 'users',
  CONTACTS: 'contacts',
  AUTH: 'auth' // Store for authentication tokens and user data
};

// Initialize IndexedDB database
const initDB = () => {
  return new Promise((resolve, reject) => {
    // Check if IndexedDB is supported
    if (!window.indexedDB) {
      console.warn('IndexedDB is not supported in this browser');
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('IndexedDB opened successfully');
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create users store if it doesn't exist
      if (!db.objectStoreNames.contains(STORES.USERS)) {
        const usersStore = db.createObjectStore(STORES.USERS, { keyPath: 'id' });
        usersStore.createIndex('email', 'email', { unique: true });
        usersStore.createIndex('token', 'token', { unique: false });
      }

      // Create contacts store if it doesn't exist
      if (!db.objectStoreNames.contains(STORES.CONTACTS)) {
        const contactsStore = db.createObjectStore(STORES.CONTACTS, { keyPath: 'id' });
        contactsStore.createIndex('name', 'name', { unique: false });
        contactsStore.createIndex('number', 'number', { unique: false });
      }

      // Create auth store if it doesn't exist (for tokens and user data)
      if (!db.objectStoreNames.contains(STORES.AUTH)) {
        const authStore = db.createObjectStore(STORES.AUTH, { keyPath: 'key' });
        authStore.createIndex('key', 'key', { unique: true });
      }

      console.log('IndexedDB stores created successfully');
    };
  });
};

// Get database instance (with caching)
let dbInstance = null;

export const getDB = async () => {
  if (dbInstance) {
    return dbInstance;
  }
  dbInstance = await initDB();
  return dbInstance;
};

// Migrate data from localStorage to IndexedDB on first load
const migrateFromLocalStorage = async () => {
  try {
    const db = await getDB();
    const migrationKey = 'db_migrated';
    
    // Check if migration has already been done
    const migrated = localStorage.getItem(migrationKey);
    if (migrated === 'true') {
      return; // Already migrated
    }

    // Migrate users
    try {
      const storedUsers = localStorage.getItem('mock_users');
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        const tx = db.transaction(STORES.USERS, 'readwrite');
        const store = tx.objectStore(STORES.USERS);
        
        // Wait for all put operations to complete
        const putPromises = users.map(user => {
          return new Promise((resolve, reject) => {
            const request = store.put(user);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        });
        
        await Promise.all(putPromises);
        // Wait for transaction to complete
        await new Promise((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        
        console.log(`Migrated ${users.length} users from localStorage to IndexedDB`);
      }
    } catch (error) {
      console.error('Error migrating users:', error);
    }

    // Migrate contacts
    try {
      const storedContacts = localStorage.getItem('mock_contacts');
      if (storedContacts) {
        const contacts = JSON.parse(storedContacts);
        const tx = db.transaction(STORES.CONTACTS, 'readwrite');
        const store = tx.objectStore(STORES.CONTACTS);
        
        // Wait for all put operations to complete
        const putPromises = contacts.map(contact => {
          return new Promise((resolve, reject) => {
            const request = store.put(contact);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        });
        
        await Promise.all(putPromises);
        // Wait for transaction to complete
        await new Promise((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        
        console.log(`Migrated ${contacts.length} contacts from localStorage to IndexedDB`);
      }
    } catch (error) {
      console.error('Error migrating contacts:', error);
    }

    // Mark migration as complete
    localStorage.setItem(migrationKey, 'true');
  } catch (error) {
    console.error('Error during migration:', error);
  }
};

// Sync data to localStorage as backup
const syncToLocalStorage = async (storeName, data) => {
  try {
    if (storeName === STORES.USERS) {
      localStorage.setItem('mock_users', JSON.stringify(data));
    } else if (storeName === STORES.CONTACTS) {
      localStorage.setItem('mock_contacts', JSON.stringify(data));
    }
  } catch (error) {
    console.error(`Error syncing ${storeName} to localStorage:`, error);
  }
};

// ===== USERS OPERATIONS ===== //

// Get all users from database
export const dbGetUsers = async () => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORES.USERS, 'readonly');
    const store = tx.objectStore(STORES.USERS);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const users = request.result || [];
        // Sync to localStorage as backup
        syncToLocalStorage(STORES.USERS, users);
        resolve(users);
      };
      request.onerror = () => {
        // Fallback to localStorage if IndexedDB fails
        try {
          const stored = localStorage.getItem('mock_users');
          const users = stored ? JSON.parse(stored) : [];
          resolve(users);
        } catch (error) {
          reject(error);
        }
      };
    });
  } catch (error) {
    console.error('Error getting users from IndexedDB, falling back to localStorage:', error);
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('mock_users');
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.error('Error getting users from localStorage:', err);
      return [];
    }
  }
};

// Add user to database
export const dbAddUser = async (user) => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORES.USERS, 'readwrite');
    const store = tx.objectStore(STORES.USERS);
    
    return new Promise((resolve, reject) => {
      const request = store.add(user);
      request.onsuccess = async () => {
        // Sync to localStorage
        const users = await dbGetUsers();
        await syncToLocalStorage(STORES.USERS, users);
        resolve(user);
      };
      request.onerror = () => {
        // If IndexedDB fails, try localStorage
        try {
          const stored = localStorage.getItem('mock_users');
          const users = stored ? JSON.parse(stored) : [];
          users.push(user);
          localStorage.setItem('mock_users', JSON.stringify(users));
          resolve(user);
        } catch (error) {
          reject(error);
        }
      };
    });
  } catch (error) {
    console.error('Error adding user to IndexedDB, falling back to localStorage:', error);
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('mock_users');
      const users = stored ? JSON.parse(stored) : [];
      users.push(user);
      localStorage.setItem('mock_users', JSON.stringify(users));
      return user;
    } catch (err) {
      throw err;
    }
  }
};

// Update user in database
export const dbUpdateUser = async (user) => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORES.USERS, 'readwrite');
    const store = tx.objectStore(STORES.USERS);
    
    return new Promise((resolve, reject) => {
      const request = store.put(user);
      request.onsuccess = async () => {
        // Sync to localStorage
        const users = await dbGetUsers();
        await syncToLocalStorage(STORES.USERS, users);
        resolve(user);
      };
      request.onerror = () => {
        // If IndexedDB fails, try localStorage
        try {
          const stored = localStorage.getItem('mock_users');
          const users = stored ? JSON.parse(stored) : [];
          const index = users.findIndex(u => u.id === user.id);
          if (index !== -1) {
            users[index] = user;
          } else {
            users.push(user);
          }
          localStorage.setItem('mock_users', JSON.stringify(users));
          resolve(user);
        } catch (error) {
          reject(error);
        }
      };
    });
  } catch (error) {
    console.error('Error updating user in IndexedDB, falling back to localStorage:', error);
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('mock_users');
      const users = stored ? JSON.parse(stored) : [];
      const index = users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        users[index] = user;
      } else {
        users.push(user);
      }
      localStorage.setItem('mock_users', JSON.stringify(users));
      return user;
    } catch (err) {
      throw err;
    }
  }
};

// Find user by email
export const dbFindUserByEmail = async (email) => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORES.USERS, 'readonly');
    const store = tx.objectStore(STORES.USERS);
    const index = store.index('email');
    const request = index.get(email);
    
    return new Promise((resolve) => {
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        // Fallback to localStorage
        try {
          const stored = localStorage.getItem('mock_users');
          const users = stored ? JSON.parse(stored) : [];
          const user = users.find(u => u.email === email) || null;
          resolve(user);
        } catch (error) {
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.error('Error finding user in IndexedDB, falling back to localStorage:', error);
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('mock_users');
      const users = stored ? JSON.parse(stored) : [];
      return users.find(u => u.email === email) || null;
    } catch (err) {
      return null;
    }
  }
};

// Find user by token
export const dbFindUserByToken = async (token) => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORES.USERS, 'readonly');
    const store = tx.objectStore(STORES.USERS);
    const index = store.index('token');
    const request = index.get(token);
    
    return new Promise((resolve) => {
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        // Fallback to localStorage
        try {
          const stored = localStorage.getItem('mock_users');
          const users = stored ? JSON.parse(stored) : [];
          const user = users.find(u => u.token === token) || null;
          resolve(user);
        } catch (error) {
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.error('Error finding user by token in IndexedDB, falling back to localStorage:', error);
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('mock_users');
      const users = stored ? JSON.parse(stored) : [];
      return users.find(u => u.token === token) || null;
    } catch (err) {
      return null;
    }
  }
};

// ===== CONTACTS OPERATIONS ===== //

// Get all contacts from database
export const dbGetContacts = async () => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORES.CONTACTS, 'readonly');
    const store = tx.objectStore(STORES.CONTACTS);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const contacts = request.result || [];
        // Sync to localStorage as backup
        syncToLocalStorage(STORES.CONTACTS, contacts);
        resolve(contacts);
      };
      request.onerror = () => {
        // Fallback to localStorage if IndexedDB fails
        try {
          const stored = localStorage.getItem('mock_contacts');
          const contacts = stored ? JSON.parse(stored) : [];
          resolve(contacts);
        } catch (error) {
          reject(error);
        }
      };
    });
  } catch (error) {
    console.error('Error getting contacts from IndexedDB, falling back to localStorage:', error);
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('mock_contacts');
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.error('Error getting contacts from localStorage:', err);
      return [];
    }
  }
};

// Add contact to database
export const dbAddContact = async (contact) => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORES.CONTACTS, 'readwrite');
    const store = tx.objectStore(STORES.CONTACTS);
    
    return new Promise((resolve, reject) => {
      const request = store.add(contact);
      request.onsuccess = async () => {
        // Sync to localStorage
        const contacts = await dbGetContacts();
        await syncToLocalStorage(STORES.CONTACTS, contacts);
        resolve(contact);
      };
      request.onerror = () => {
        // If IndexedDB fails, try localStorage
        try {
          const stored = localStorage.getItem('mock_contacts');
          const contacts = stored ? JSON.parse(stored) : [];
          contacts.push(contact);
          localStorage.setItem('mock_contacts', JSON.stringify(contacts));
          resolve(contact);
        } catch (error) {
          reject(error);
        }
      };
    });
  } catch (error) {
    console.error('Error adding contact to IndexedDB, falling back to localStorage:', error);
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('mock_contacts');
      const contacts = stored ? JSON.parse(stored) : [];
      contacts.push(contact);
      localStorage.setItem('mock_contacts', JSON.stringify(contacts));
      return contact;
    } catch (err) {
      throw err;
    }
  }
};

// Delete contact from database
export const dbDeleteContact = async (id) => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORES.CONTACTS, 'readwrite');
    const store = tx.objectStore(STORES.CONTACTS);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = async () => {
        // Sync to localStorage
        const contacts = await dbGetContacts();
        await syncToLocalStorage(STORES.CONTACTS, contacts);
        resolve(id);
      };
      request.onerror = () => {
        // If IndexedDB fails, try localStorage
        try {
          const stored = localStorage.getItem('mock_contacts');
          const contacts = stored ? JSON.parse(stored) : [];
          const filtered = contacts.filter(c => c.id !== id);
          localStorage.setItem('mock_contacts', JSON.stringify(filtered));
          resolve(id);
        } catch (error) {
          reject(error);
        }
      };
    });
  } catch (error) {
    console.error('Error deleting contact from IndexedDB, falling back to localStorage:', error);
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('mock_contacts');
      const contacts = stored ? JSON.parse(stored) : [];
      const filtered = contacts.filter(c => c.id !== id);
      localStorage.setItem('mock_contacts', JSON.stringify(filtered));
      return id;
    } catch (err) {
      throw err;
    }
  }
};

// ===== AUTH OPERATIONS (for tokens and user data) ===== //

// Save auth token to IndexedDB
export const dbSaveToken = async (token) => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORES.AUTH, 'readwrite');
    const store = tx.objectStore(STORES.AUTH);
    
    return new Promise((resolve, reject) => {
      const request = store.put({ key: 'auth_token', value: token });
      request.onsuccess = () => {
        resolve(token);
      };
      request.onerror = () => {
        // Fallback to localStorage if IndexedDB fails
        try {
          localStorage.setItem('auth_token', token);
          resolve(token);
        } catch (error) {
          reject(error);
        }
      };
    });
  } catch (error) {
    console.error('Error saving token to IndexedDB, falling back to localStorage:', error);
    // Fallback to localStorage
    try {
      localStorage.setItem('auth_token', token);
      return token;
    } catch (err) {
      throw err;
    }
  }
};

// Get auth token from IndexedDB
export const dbGetToken = async () => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORES.AUTH, 'readonly');
    const store = tx.objectStore(STORES.AUTH);
    const request = store.get('auth_token');
    
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => {
        // Fallback to localStorage
        try {
          const token = localStorage.getItem('auth_token');
          resolve(token);
        } catch (error) {
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.error('Error getting token from IndexedDB, falling back to localStorage:', error);
    // Fallback to localStorage
    try {
      return localStorage.getItem('auth_token');
    } catch (err) {
      return null;
    }
  }
};

// Remove auth token from IndexedDB
export const dbRemoveToken = async () => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORES.AUTH, 'readwrite');
    const store = tx.objectStore(STORES.AUTH);
    
    return new Promise((resolve) => {
      const request = store.delete('auth_token');
      request.onsuccess = () => {
        // Also remove from localStorage as backup
        try {
          localStorage.removeItem('auth_token');
        } catch (error) {
          // Ignore localStorage errors
        }
        resolve();
      };
      request.onerror = () => {
        // Fallback to localStorage
        try {
          localStorage.removeItem('auth_token');
        } catch (error) {
          // Ignore errors
        }
        resolve();
      };
    });
  } catch (error) {
    console.error('Error removing token from IndexedDB, falling back to localStorage:', error);
    // Fallback to localStorage
    try {
      localStorage.removeItem('auth_token');
    } catch (err) {
      // Ignore errors
    }
  }
};

// Save user data to IndexedDB
export const dbSaveUser = async (user) => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORES.AUTH, 'readwrite');
    const store = tx.objectStore(STORES.AUTH);
    
    return new Promise((resolve, reject) => {
      const request = store.put({ key: 'auth_user', value: user });
      request.onsuccess = () => {
        // Also save to localStorage as backup
        try {
          localStorage.setItem('auth_user', JSON.stringify(user));
        } catch (error) {
          // Ignore localStorage errors
        }
        if (process.env.NODE_ENV === 'development') {
          console.log('User data saved to IndexedDB successfully');
        }
        resolve(user);
      };
      request.onerror = () => {
        console.error('IndexedDB put error:', request.error);
        // Fallback to localStorage if IndexedDB fails
        try {
          localStorage.setItem('auth_user', JSON.stringify(user));
          resolve(user);
        } catch (error) {
          reject(error);
        }
      };
    });
  } catch (error) {
    console.error('Error saving user to IndexedDB, falling back to localStorage:', error);
    // Fallback to localStorage
    try {
      localStorage.setItem('auth_user', JSON.stringify(user));
      return user;
    } catch (err) {
      throw err;
    }
  }
};

// Get user data from IndexedDB
export const dbGetUser = async () => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORES.AUTH, 'readonly');
    const store = tx.objectStore(STORES.AUTH);
    const request = store.get('auth_user');
    
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => {
        // Fallback to localStorage
        try {
          const stored = localStorage.getItem('auth_user');
          const user = stored ? JSON.parse(stored) : null;
          resolve(user);
        } catch (error) {
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.error('Error getting user from IndexedDB, falling back to localStorage:', error);
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch (err) {
      return null;
    }
  }
};

// Remove user data from IndexedDB
export const dbRemoveUser = async () => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORES.AUTH, 'readwrite');
    const store = tx.objectStore(STORES.AUTH);
    
    return new Promise((resolve) => {
      const request = store.delete('auth_user');
      request.onsuccess = () => {
        // Also remove from localStorage as backup
        try {
          localStorage.removeItem('auth_user');
        } catch (error) {
          // Ignore localStorage errors
        }
        resolve();
      };
      request.onerror = () => {
        // Fallback to localStorage
        try {
          localStorage.removeItem('auth_user');
        } catch (error) {
          // Ignore errors
        }
        resolve();
      };
    });
  } catch (error) {
    console.error('Error removing user from IndexedDB, falling back to localStorage:', error);
    // Fallback to localStorage
    try {
      localStorage.removeItem('auth_user');
    } catch (err) {
      // Ignore errors
    }
  }
};

// Migrate auth data from localStorage to IndexedDB
const migrateAuthFromLocalStorage = async () => {
  try {
    const db = await getDB();
    const migrationKey = 'auth_migrated';
    
    // Check if migration has already been done
    const migrated = localStorage.getItem(migrationKey);
    if (migrated === 'true') {
      return; // Already migrated
    }

    const tx = db.transaction(STORES.AUTH, 'readwrite');
    const store = tx.objectStore(STORES.AUTH);

    // Migrate token
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await new Promise((resolve, reject) => {
          const request = store.put({ key: 'auth_token', value: token });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
        console.log('Migrated auth token from localStorage to IndexedDB');
      }
    } catch (error) {
      console.error('Error migrating token:', error);
    }

    // Migrate user data
    try {
      const userData = localStorage.getItem('auth_user');
      if (userData) {
        const user = JSON.parse(userData);
        await new Promise((resolve, reject) => {
          const request = store.put({ key: 'auth_user', value: user });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
        console.log('Migrated user data from localStorage to IndexedDB');
      }
    } catch (error) {
      console.error('Error migrating user data:', error);
    }

    // Wait for transaction to complete
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // Mark migration as complete
    localStorage.setItem(migrationKey, 'true');
  } catch (error) {
    console.error('Error during auth migration:', error);
  }
};

// Initialize database and migrate data on module load
if (typeof window !== 'undefined') {
  // Initialize and migrate on load
  getDB()
    .then(async () => {
      await migrateFromLocalStorage();
      await migrateAuthFromLocalStorage();
    })
    .catch((error) => {
      console.error('Failed to initialize IndexedDB:', error);
    });
}

