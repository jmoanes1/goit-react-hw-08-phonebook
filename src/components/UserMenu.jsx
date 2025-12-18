import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../redux/authSlice';
import { useNavigate } from 'react-router-dom';
import FlashMessage from './FlashMessage';

const UserMenu = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleLogout = async () => {
    try {
      // Dispatch logout action
      await dispatch(logoutUser()).unwrap();
      // Show success message
      setSuccessMessage('Logged out successfully. See you soon!');
      // Navigate to home page after a brief delay to show the message
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      // Even if logout fails, navigate away (state is cleared anyway)
      console.error('Logout error:', error);
      // Show success message anyway since state is cleared
      setSuccessMessage('Logged out successfully. See you soon!');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email ? user.email[0].toUpperCase() : 'U';
  };

  return (
    <>
      {successMessage && (
        <FlashMessage
          message={successMessage}
          type="success"
          onClose={() => setSuccessMessage(null)}
          duration={2000}
        />
      )}
      <div className="user-menu">
        <div className="user-info">
          <div className="user-avatar">{getUserInitials()}</div>
          <div className="user-details">
            <span className="user-name">{user.name || 'User'}</span>
            <div className="user-email-row">
              <span className="user-email">{user.email}</span>
              <button onClick={handleLogout} className="user-logout-btn">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserMenu;