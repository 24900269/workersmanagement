import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ title = 'Track X', showBack = false, actionBtn = null, children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    navigate(-1);
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="app">
      {/* Top Bar */}
      <header className="top-bar">
        {showBack ? (
          <button className="back-btn" onClick={handleBack} aria-label="Go Back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
        ) : null}
        <h1>{title}</h1>
        {actionBtn ? (
          <button className="action-btn" onClick={actionBtn.onClick}>
            {actionBtn.icon || (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
            {actionBtn.label}
          </button>
        ) : null}
      </header>

      {/* Screen / Content */}
      <main className="screen">
        {children}
      </main>

      {/* Navigation Bar */}
      <nav className="nav-bar">
        <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
          <span className="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </span>
          <span className="nav-label">Home</span>
        </Link>

        <Link to="/workers" className={`nav-item ${isActive('/workers') ? 'active' : ''}`}>
          <span className="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <span className="nav-label">Workers</span>
        </Link>

        <Link to="/attendance" className={`nav-item ${isActive('/attendance') ? 'active' : ''}`}>
          <span className="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          <span className="nav-label">Attendance</span>
        </Link>

        <Link to="/salary" className={`nav-item ${isActive('/salary') ? 'active' : ''}`}>
          <span className="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" />
              <path d="M12 1v6m0 6v4M4.22 4.22l4.24 4.24m3.08 3.08l4.24 4.24M1 12h6m6 0h4M4.22 19.78l4.24-4.24m3.08-3.08l4.24-4.24M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
            </svg>
          </span>
          <span className="nav-label">Salary</span>
        </Link>

        <Link to="/records" className={`nav-item ${isActive('/records') ? 'active' : ''}`}>
          <span className="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="13" x2="12" y2="19" />
              <line x1="9" y1="16" x2="15" y2="16" />
            </svg>
          </span>
          <span className="nav-label">Records</span>
        </Link>

        {user?.is_admin === 1 || user?.is_admin === true ? (
          <Link to="/admin" className={`nav-item ${isActive('/admin') ? 'active' : ''}`}>
            <span className="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <span className="nav-label">Admin</span>
          </Link>
        ) : null}
      </nav>
    </div>
  );
}
