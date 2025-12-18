
/**
 * Filter
 * - value: string
 * - onChange: function(value)
 */
import React from "react";

export default function Filter({ value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ position: 'relative' }}>
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          style={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: '#94a3b8', 
            pointerEvents: 'none' 
          }}
        >
          <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <input
          className="filter-input"
          placeholder="Search contacts by name..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ paddingLeft: '40px' }}
          aria-label="Search contacts"
        />
      </div>
    </div>
  );
}
