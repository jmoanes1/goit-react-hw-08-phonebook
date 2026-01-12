/**
 * Complete Example: Full CRUD Contacts App
 * 
 * A complete example showing all CRUD operations working together
 */

import React, { useState, useEffect } from 'react';
import { contactsAPI, authAPI, tokenService } from '../../services/api';

const CompleteExample = () => {
  // Contacts state
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({ name: '', number: '' });
  const [editingId, setEditingId] = useState(null);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(tokenService.isAuthenticated());
  const [user, setUser] = useState(null);

  // Fetch contacts on mount and when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchContacts();
      fetchCurrentUser();
    }
  }, [isAuthenticated]);

  /**
   * Fetch all contacts
   */
  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contactsAPI.getAll();
      setContacts(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch contacts');
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get current user
   */
  const fetchCurrentUser = async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  /**
   * Handle form input changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Handle add contact
   */
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.number.trim()) {
      setError('Name and number are required');
      return;
    }

    try {
      setError(null);
      const newContact = await contactsAPI.add({
        name: formData.name.trim(),
        number: formData.number.trim(),
      });
      setContacts((prev) => [...prev, newContact]);
      setFormData({ name: '', number: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add contact');
      console.error('Error adding contact:', err);
    }
  };

  /**
   * Handle update contact
   */
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.number.trim()) {
      setError('Name and number are required');
      return;
    }

    try {
      setError(null);
      const updatedContact = await contactsAPI.update(editingId, {
        name: formData.name.trim(),
        number: formData.number.trim(),
      });
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === editingId ? updatedContact : contact
        )
      );
      setFormData({ name: '', number: '' });
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update contact');
      console.error('Error updating contact:', err);
    }
  };

  /**
   * Start editing a contact
   */
  const startEdit = (contact) => {
    setFormData({ name: contact.name, number: contact.number });
    setEditingId(contact.id);
  };

  /**
   * Cancel editing
   */
  const cancelEdit = () => {
    setFormData({ name: '', number: '' });
    setEditingId(null);
  };

  /**
   * Handle delete contact
   */
  const handleDelete = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      await contactsAPI.delete(contactId);
      setContacts((prev) => prev.filter((contact) => contact.id !== contactId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete contact');
      console.error('Error deleting contact:', err);
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      await authAPI.logout();
      setIsAuthenticated(false);
      setUser(null);
      setContacts([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div>
        <h2>Please log in to view contacts</h2>
        <p>Use the AuthExample component to log in first.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>My Contacts</h1>
          {user && <p>Welcome, {user.name}!</p>}
        </div>
        <button onClick={handleLogout}>Logout</button>
      </div>

      {error && (
        <div style={{ color: 'red', padding: '10px', marginBottom: '20px', backgroundColor: '#fee' }}>
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      <form onSubmit={editingId ? handleUpdate : handleAdd} style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>{editingId ? 'Edit Contact' : 'Add New Contact'}</h2>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Contact name"
            required
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="tel"
            name="number"
            value={formData.number}
            onChange={handleChange}
            placeholder="Phone number"
            required
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
        </div>
        <div>
          <button type="submit" style={{ marginRight: '10px' }}>
            {editingId ? 'Update' : 'Add'} Contact
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Contacts List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2>Contacts ({contacts.length})</h2>
          <button onClick={fetchContacts} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {loading && contacts.length === 0 ? (
          <div>Loading contacts...</div>
        ) : contacts.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            No contacts yet. Add your first contact above!
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {contacts.map((contact) => (
              <li
                key={contact.id}
                style={{
                  padding: '15px',
                  marginBottom: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong>{contact.name}</strong>
                  <div style={{ color: '#666', fontSize: '14px' }}>{contact.number}</div>
                </div>
                <div>
                  <button
                    onClick={() => startEdit(contact)}
                    style={{ marginRight: '10px' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    style={{ backgroundColor: '#dc3545', color: 'white' }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CompleteExample;

