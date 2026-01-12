/**
 * Example Component: Delete Contact
 * 
 * Demonstrates how to delete a contact using the API
 */

import React, { useState } from 'react';
import { contactsAPI } from '../../services/api';

const DeleteContactExample = ({ contactId, contactName, onDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  /**
   * Handle delete confirmation
   */
  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call API to delete contact
      await contactsAPI.delete(contactId);

      console.log('Contact deleted successfully');

      // Call callback to notify parent component
      if (onDeleted) {
        onDeleted(contactId);
      }

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete contact';
      setError(errorMessage);
      console.error('Error deleting contact:', err);
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancel delete operation
   */
  const handleCancel = () => {
    setShowConfirm(false);
    setError(null);
  };

  return (
    <div>
      {!showConfirm ? (
        <button onClick={handleDelete} disabled={loading}>
          Delete Contact
        </button>
      ) : (
        <div>
          <p>
            Are you sure you want to delete <strong>{contactName}</strong>?
          </p>
          {error && (
            <div style={{ color: 'red', marginBottom: '10px' }}>
              {error}
            </div>
          )}
          <button
            onClick={handleDelete}
            disabled={loading}
            style={{ marginRight: '10px', backgroundColor: 'red', color: 'white' }}
          >
            {loading ? 'Deleting...' : 'Yes, Delete'}
          </button>
          <button onClick={handleCancel} disabled={loading}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default DeleteContactExample;

