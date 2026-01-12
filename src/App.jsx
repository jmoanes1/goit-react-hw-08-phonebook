// code with Redux-based App.jsx //

import React, { useMemo, useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { refreshUser } from "./redux/authSlice";
import { fetchContacts, addContact, deleteContact, updateFilter } from "./redux/contactsSlice";
import Navigation from "./components/Navigation";
import HomePage from "./components/HomePage";
import RegisterPage from "./components/RegisterPage";
import LoginPage from "./components/LoginPage";
import ContactList from "./components/ContactList";
import ContactForm from "./components/ContactForm";
import Filter from "./components/Filter";
import UserMenu from "./components/UserMenu";
import UserProfile from "./components/UserProfile";
import "./App.css";

const PrivateRoute = ({ children }) => {
  const isLoggedIn = useSelector(state => state.auth.isLoggedIn);
  const isRefreshing = useSelector(state => state.auth.isRefreshing);
  const token = useSelector(state => state.auth.token);
  
  // If we're refreshing (checking auth status), wait before redirecting
  // Also check if token exists as a fallback
  if (isRefreshing || (token && !isLoggedIn)) {
    // Show loading state while refreshing
    return (
      <div className="app">
        <div className="container">
          <div>Loading...</div>
        </div>
      </div>
    );
  }
  
  return isLoggedIn ? children : <Navigate to="/login" />;
};



function App() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(state => state.auth.isLoggedIn);
  const isRefreshing = useSelector(state => state.auth.isRefreshing);
  const contacts = useSelector((state) => state.contacts.items);
  const filter = useSelector((state) => state.contacts.filter);
  const status = useSelector((state) => state.contacts.status);
  const error = useSelector((state) => state.contacts.error);
  const [showAddForm, setShowAddForm] = useState(contacts.length > 0);

  // Refresh user on app load - check both localStorage and IndexedDB for token
  useEffect(() => {
    const refresh = async () => {
      // Only attempt refresh if we're not already logged in and we're still refreshing
      // This prevents unnecessary API calls if user is already authenticated
      // Also prevents refresh from running multiple times
      if (!isLoggedIn && isRefreshing) {
        try {
          await dispatch(refreshUser()).unwrap();
        } catch (err) {
          // If refresh fails, user is not authenticated
          // Only log in development to reduce console noise
          if (process.env.NODE_ENV === 'development') {
            const errorMsg = err?.message || 'Unknown error';
            // Don't log "No token available" as it's expected when user is not logged in
            if (!errorMsg.includes('No token available')) {
              console.log('User not authenticated or token expired:', errorMsg);
            }
          }
        }
      }
    };
    refresh();
  }, [dispatch, isLoggedIn, isRefreshing]);

  // Fetch contacts when user logs in (only after refresh completes)
  useEffect(() => {
    if (isLoggedIn && !isRefreshing) {
      dispatch(fetchContacts());
    }
  }, [isLoggedIn, isRefreshing, dispatch]);

  // Show form if contacts exist, hide if no contacts
  useEffect(() => {
    setShowAddForm(contacts.length > 0);
  }, [contacts.length]);

  const handleAddContact = async (contact) => {
    // basic validation: non-empty & duplicate prevention (case-insensitive)
    if (!contact.name.trim()) {
      alert("Please enter a name.");
      return;
    }
    const normalized = contact.name.trim().toLowerCase();
    const exists = contacts.some((c) => c.name.toLowerCase() === normalized);
    if (exists) {
      alert(`${contact.name} is already in contacts.`);
      return;
    }
    
    // Dispatch addContact and handle errors
    try {
      await dispatch(addContact(contact)).unwrap();
      // Keep form visible after adding contact
      setShowAddForm(true);
    } catch (err) {
      // Error is already stored in state and will be displayed
      console.error('Failed to add contact:', err);
      // Show alert for immediate feedback
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to add contact. Please try again.';
      alert(errorMessage);
    }
  };

  const handleShowAddForm = () => {
    setShowAddForm(true);
    // Scroll to form after state update
    setTimeout(() => {
      const addContactSection = document.getElementById('add-contact-section');
      if (addContactSection) {
        addContactSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        addContactSection.style.transition = 'box-shadow 0.3s ease';
        addContactSection.style.boxShadow = '0 0 0 4px rgba(79, 70, 229, 0.2)';
        setTimeout(() => {
          addContactSection.style.boxShadow = '';
        }, 2000);
        setTimeout(() => {
          const nameInput = document.querySelector('#add-contact-section input[name="name"]');
          if (nameInput) {
            nameInput.focus();
          }
        }, 600);
      }
    }, 100);
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteContact(id)).unwrap();
    } catch (err) {
      // Error is already stored in state and will be displayed
      console.error('Failed to delete contact:', err);
      // Show alert for immediate feedback
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to delete contact. Please try again.';
      alert(errorMessage);
    }
  };

  const handleFilterChange = (value) => {
    dispatch(updateFilter(value));
  };

  const total = contacts.length;
  const shown = contacts.filter((c) => c.name.toLowerCase().includes(filter.trim().toLowerCase())).length;

  // Render loading state
  if (isRefreshing) {
    return (
      <div className="app">
        <div className="container">
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Router basename="/goit-react-hw-08-phonebook">
      <div className="app">
        <header>
          <div className={`header-container ${!isLoggedIn ? 'centered' : ''}`}>
            <Navigation />
            {isLoggedIn && <UserMenu />}
          </div>
        </header>
        <div className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/contacts" element={
              <PrivateRoute>
                <div>
                  {/* Show loading indicator when fetching */}
                  {status === 'loading' && <div className="loading">Updating contacts...</div>}
                  
                  {/* Display error messages */}
                  {error && status === 'failed' && (
                    <div className="error-message" style={{
                      padding: '12px 16px',
                      marginBottom: '16px',
                      backgroundColor: '#fee',
                      border: '1px solid #fcc',
                      borderRadius: 'var(--radius-sm)',
                      color: '#c33',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66667 10 1.66667C5.39763 1.66667 1.66667 5.39763 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 6.66667V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 13.3333H10.0083" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}
                  
                  {showAddForm && (
                    <section className="card" id="add-contact-section">
                      <h2>Add contact</h2>
                      <ContactForm onAdd={handleAddContact} />
                    </section>
                  )}
                  
                  <section className="card">
                    <div className="list-header">
                      {filter.trim() !== "" && (
                        <div className="count">{`${shown} of ${total}`}</div>
                      )}
                    </div>
                    
                    {contacts.length > 0 && (
                      <Filter value={filter} onChange={handleFilterChange} />
                    )}
                    
                    <ContactList 
                      contacts={contacts.filter((c) => 
                        c.name.toLowerCase().includes(filter.trim().toLowerCase())
                      )} 
                      onDelete={handleDelete} 
                      onShowAddForm={handleShowAddForm} 
                    />
                  </section>
                </div>
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <UserProfile />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
export default App
// End of redux Apps.js //



//... This Code without Redux:...//

// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import ContactForm from "./components/ContactForm";
// import ContactList from "./components/ContactList";
// import Filter from "./components/Filter";
// import "./App.css"; // import CSS

// // Default contacts
// const DEFAULT_CONTACTS = [
//   { id: "id-1", name: "Rosie Simpson", number: "459-12-56" },
//   { id: "id-2", name: "Hermione Kline", number: "443-89-12" },
//   { id: "id-3", name: "Eden Clements", number: "645-17-79" },
//   { id: "id-4", name: "Annie Copeland", number: "227-91-26" },
// ];

// function App() {
//   // Load contacts from localStorage OR fallback to defaults
//   const [contacts, setContacts] = useState(() => {
//     const savedContacts = localStorage.getItem("contacts");
//     if (savedContacts) {
//       const parsed = JSON.parse(savedContacts);
//       return parsed.length > 0 ? parsed : DEFAULT_CONTACTS;
//     }
//     return DEFAULT_CONTACTS;
//   });

//   const [filter, setFilter] = useState("");

//   // Sync contacts with localStorage whenever they change
//   useEffect(() => {
//     localStorage.setItem("contacts", JSON.stringify(contacts));
//   }, [contacts]);

//   // Add contact with validation
//   const addContact = useCallback((newContact) => {
//     const exists = contacts.some(
//       (contact) => contact.name.toLowerCase() === newContact.name.toLowerCase()
//     );

//     if (exists) {
//       alert(`${newContact.name} is already in the contacts!`);
//       return;
//     }

//     setContacts([...contacts, { ...newContact, id: crypto.randomUUID() }]);
//   }, [contacts]);

//   // Delete contact
//   const deleteContact = useCallback((id) => {
//     setContacts((prevContacts) =>
//       prevContacts.filter((contact) => contact.id !== id)
//     );
//   }, []);

//   // Filter contacts
//   const filteredContacts = useMemo(() => 
//     contacts.filter((contact) =>
//       contact.name.toLowerCase().includes(filter.toLowerCase())
//     ), [contacts, filter]
//   );

//   // Contact statistics
//   const contactStats = useMemo(() => ({
//     total: contacts.length,
//     filtered: filteredContacts.length,
//     hasActiveFilter: filter.trim().length > 0
//   }), [contacts.length, filteredContacts.length, filter]);

//   return (
//     <div className="app">
//       <div className="main-card">
//         <h1 className="title"> Phonebook</h1>

//         <div className="section">
//           <ContactForm onAdd={addContact} />
//         </div>

//         <div className="section">
//           <h2>
//             Contacts 
//             <span className="contact-count">
//               ({contactStats.hasActiveFilter 
//                 ? `${contactStats.filtered} of ${contactStats.total}` 
//                 : contactStats.total})
//             </span>
//           </h2>
//           <Filter value={filter} onChange={setFilter} />
//         </div>

//         <div className="section">
//           <ContactList contacts={filteredContacts} onDelete={deleteContact} />
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;
