/**
 * Example Component: Update Contact
 * 
 * Demonstrates how to update an existing contact using the API
 */

import React, { useState, useEffect } from 'react';
import { contactsAPI } from '../../services/api';

const UpdateContactExample = ({ contactId, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    number: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch contact data when component mounts or contactId changes
  useEffect(() => {
    if (contactId) {
      fetchContact();
    }
  }, [contactId]);

  /**
   * Fetch contact data to populate the form
   */
  const fetchContact = async () => {
    try {
      setFetching(true);
      setError(null);
      const contact = await contactsAPI.getById(contactId);
      setFormData({
        name: contact.name || '',
        number: contact.number || '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch contact');
      console.error('Error fetching contact:', err);
    } finally {
      setFetching(false);
    }
  };

  /**
   * Handle form input changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

      // Call API to update contact
      const updatedContact = await contactsAPI.update(contactId, {
        name: formData.name.trim(),
        number: formData.number.trim(),
      });

      // Success!
      setSuccess(true);
      console.log('Contact updated:', updatedContact);

      // Call callback to notify parent component
      if (onUpdate) {
        onUpdate(updatedContact);
      }

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update contact';
      setError(errorMessage);
      console.error('Error updating contact:', err);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div>Loading contact data...</div>;
  }

  return (
    <div>
      <h2>Update Contact</h2>

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
            Contact updated successfully!
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Contact'}
        </button>
      </form>
    </div>
  );
};

export default UpdateContactExample;

