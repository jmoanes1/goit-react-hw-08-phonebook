/**
 * Example Component: Contacts List
 * 
 * Demonstrates how to fetch and display all contacts from the API
 */

import React, { useState, useEffect } from 'react';
import { contactsAPI } from '../../services/api';

const ContactsListExample = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch contacts on component mount
  useEffect(() => {
    fetchContacts();
  }, []);

  /**
   * Fetch all contacts from the API
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

  if (loading) {
    return <div>Loading contacts...</div>;
  }

  if (error) {
    return (
      <div>
        <p style={{ color: 'red' }}>Error: {error}</p>
        <button onClick={fetchContacts}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Contacts List</h2>
      <button onClick={fetchContacts}>Refresh</button>
      
      {contacts.length === 0 ? (
        <p>No contacts found. Add your first contact!</p>
      ) : (
        <ul>
          {contacts.map((contact) => (
            <li key={contact.id}>
              <strong>{contact.name}</strong> - {contact.number}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ContactsListExample;

