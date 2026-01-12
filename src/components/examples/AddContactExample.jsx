/**
 * Example Component: Add Contact Form
 * 
 * Demonstrates how to add a new contact using the API
 */

import React, { useState } from 'react';
import { contactsAPI } from '../../services/api';

const AddContactExample = () => {
  const [formData, setFormData] = useState({
    name: '',
    number: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  /**
   * Handle form input changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors when user starts typing
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (!formData.number.trim()) {
      setError('Phone number is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Call API to add contact
      const newContact = await contactsAPI.add({
        name: formData.name.trim(),
        number: formData.number.trim(),
      });

      // Success!
      setSuccess(true);
      console.log('Contact added:', newContact);
      
      // Reset form
      setFormData({ name: '', number: '' });
      
      // Optionally, you can call a callback to refresh the contacts list
      // onContactAdded?.(newContact);
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add contact';
      setError(errorMessage);
      console.error('Error adding contact:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Add New Contact</h2>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter contact name"
            disabled={loading}
            required
            autoComplete="name"
          />
        </div>

        <div>
          <label htmlFor="number">Phone Number:</label>
          <input
            type="tel"
            id="number"
            name="number"
            value={formData.number}
            onChange={handleChange}
            placeholder="Enter phone number"
            disabled={loading}
            required
            autoComplete="tel"
          />
        </div>

        {error && (
          <div style={{ color: 'red', marginTop: '10px' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ color: 'green', marginTop: '10px' }}>
            Contact added successfully!
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Contact'}
        </button>
      </form>
    </div>
  );
};

export default AddContactExample;

