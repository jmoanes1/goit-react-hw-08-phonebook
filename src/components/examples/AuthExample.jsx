/**
 * Example Component: Authentication (Signup & Login)
 * 
 * Demonstrates how to use the authentication API
 */

import React, { useState } from 'react';
import { authAPI, tokenService } from '../../services/api';

const AuthExample = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

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
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      let response;
      if (isLogin) {
        // Login
        response = await authAPI.login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        // Signup
        response = await authAPI.signup({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
      }

      // Token is automatically saved by the API service
      setUser(response.user);
      console.log('Authentication successful:', response);

      // Reset form
      setFormData({ name: '', email: '', password: '' });

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Authentication failed';
      setError(errorMessage);
      console.error('Authentication error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      console.log('Logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  /**
   * Get current user
   */
  const handleGetCurrentUser = async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      console.log('Current user:', userData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get current user');
      console.error('Error getting current user:', err);
    }
  };

  // If user is logged in, show user info
  if (user || tokenService.isAuthenticated()) {
    return (
      <div>
        <h2>Welcome!</h2>
        {user && (
          <div>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
        )}
        <div style={{ marginTop: '20px' }}>
          <button onClick={handleGetCurrentUser} style={{ marginRight: '10px' }}>
            Refresh User Info
          </button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>

      <button onClick={() => setIsLogin(!isLogin)}>
        Switch to {isLogin ? 'Sign Up' : 'Login'}
      </button>

      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        {!isLogin && (
          <div>
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              disabled={loading}
              required={!isLogin}
            />
          </div>
        )}

        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            disabled={loading}
            required
          />
        </div>

        {error && (
          <div style={{ color: 'red', marginTop: '10px' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
};

export default AuthExample;

