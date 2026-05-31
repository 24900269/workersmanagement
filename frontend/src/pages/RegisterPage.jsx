import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredUser, setRegisteredUser] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const userRegex = /^[a-zA-Z0-9_]+$/;
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!userRegex.test(username.trim())) {
      setError('Username may only contain letters, numbers, and underscores');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const user = await register(username.trim(), password);
      toast.success('Registration successful!');
      setRegisteredUser(user);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Registration failed. Try a different username.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    navigate('/');
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h1 className="auth-app-name">Track X</h1>
        <p className="auth-tagline">Construction Worker Management</p>
      </div>

      <div className="auth-card">
        {registeredUser ? (
          <div>
            <h2>Account Created!</h2>
            <p className="auth-card-sub">Please save your unique User ID for reference.</p>

            <div className="uid-badge">
              <div className="uid-label">YOUR UNIQUE USER ID</div>
              <div className="uid-value">{registeredUser.uid}</div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '24px' }}>
              Welcome to TrackX, {registeredUser.username}. You are now ready to manage your construction workforce.
            </p>

            <button onClick={handleProceed} className="btn-primary">
              Proceed to Dashboard
            </button>
          </div>
        ) : (
          <div>
            <h2>Create Account</h2>
            <p className="auth-card-sub">Register to start tracking workers and payroll</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Only letters, numbers, and underscores"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              {error && <div className="form-error" style={{ marginBottom: '14px' }}>{error}</div>}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <div className="spinner-sm" /> : 'Register'}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account? <Link to="/login">Log in here</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
