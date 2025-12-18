
/**
 * ContactList
 * props:
 *  - contacts: array [{ id, name, number }]
 *  - onDelete(id)
 */

import React, { useMemo } from "react";

export default function ContactList({ contacts, onDelete, onShowAddForm }) {
  // memoize rendered list items to avoid unnecessary re-renders
  const items = useMemo(() => {
    return contacts.map((c) => (
      <div className="contact" key={c.id}>
        <div className="meta">
          <div className="avatar">{getInitials(c.name)}</div>
          <div>
            <div className="name">{c.name}</div>
            <div className="number">{c.number}</div>
          </div>
        </div>
        <div>
          <button
            className="icon-button"
            onClick={() => {
              if (window.confirm(`Remove ${c.name}?`)) onDelete(c.id);
            }}
            title="Remove contact"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Remove
          </button>
        </div>
      </div>
    ));
  }, [contacts, onDelete]);

  if (!contacts || contacts.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="empty-state-title">No contacts yet</h3>
        <p className="empty-state-description">You haven't added any contacts. Get started by creating your first contact.</p>
        <button 
          className="empty-state-button"
          onClick={() => {
            if (onShowAddForm) {
              onShowAddForm();
            }
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Add New Contact
        </button>
      </div>
    );
  }

  return <div className="list">{items}</div>;
}

function getInitials(name) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
