import React, { useState, useCallback, useEffect } from "react";

/**
 * ContactForm
 * - onAdd({ name, number })
 * - formats phone number as XXX-XX-XX-X (max 8 digits)
 */

function formatPhoneDigits(digits) {
  // allow up to 8 digits
  const d = digits.slice(0, 8);
  const parts = [];
  if (d.length >= 3) {
    parts.push(d.slice(0, 3));
    if (d.length >= 5) {
      parts.push(d.slice(3, 5));
      if (d.length >= 7) {
        parts.push(d.slice(5, 7));
        if (d.length >= 8) {
          parts.push(d.slice(7, 8));
        } else if (d.length > 7) {
          parts.push(d.slice(7));
        }
      } else {
        parts.push(d.slice(5));
      }
    } else {
      parts.push(d.slice(3));
    }
  } else {
    parts.push(d);
  }
  return parts.filter(Boolean).join("-");
}

export default function ContactForm({ onAdd }) {
  const [name, setName] = useState("");
  const [rawNumber, setRawNumber] = useState(""); // digits only string
  const [displayNumber, setDisplayNumber] = useState("");

  // update displayNumber when rawNumber changes
  useEffect(() => {
    setDisplayNumber(formatPhoneDigits(rawNumber));
  }, [rawNumber]);

  const handleNumberChange = useCallback((e) => {
    // accept only digits
    const input = e.target.value;
    // remove non-digits
    const digits = input.replace(/\D/g, "");
    // limit to 8 digits for the format
    setRawNumber(digits.slice(0, 8));
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      const trimmedName = name.trim();
      if (!trimmedName) {
        alert("Please enter a name.");
        return;
      }
      if (rawNumber.length < 8) {
        const proceed = window.confirm(
          "Number seems short. Do you want to add anyway?"
        );
        if (!proceed) return;
      }

      onAdd({
        name: trimmedName,
        number: formatPhoneDigits(rawNumber),
      });

      // clear
      setName("");
      setRawNumber("");
    },
    [name, rawNumber, onAdd]
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <input
          className="input"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Contact name"
        />
      </div>

      <div className="form-row">
        <input
          className="input"
          placeholder="Phone (digits only, will format)"
          value={displayNumber}
          onChange={handleNumberChange}
          aria-label="Phone number"
        />
        <button type="submit" className="button small">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Add
        </button>
      </div>

      <div className="info" style={{ marginTop: '16px', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: '2px' }}>
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <strong>Format:</strong> <code>XXX-XX-XX-X</code> — up to 8 digits. Non-digit characters are ignored.
          </div>
        </div>
      </div>
    </form>
  );
}
