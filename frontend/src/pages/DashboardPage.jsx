import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import WorkerCard from '../components/WorkerCard';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import { DAYS, MONTHS, formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchTodayWorkers = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        const localToday = `${y}-${m}-${d}`;
        const { data } = await api.get(`/workers/today?date=${localToday}`);
        if (active) {
          setWorkers(data);
        }
      } catch (err) {
        console.error('Error fetching today workers:', err);
        toast.error('Failed to load today\'s status');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchTodayWorkers();
    return () => {
      active = false;
    };
  }, []);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getFormattedDate = () => {
    const today = new Date();
    return `${DAYS[today.getDay()]}, ${today.getDate()} ${MONTHS[today.getMonth()]} ${today.getFullYear()}`;
  };

  const presentCount = workers.filter((w) => w.today_status === 'present').length;
  const totalCount = workers.length;
  const projectedExpense = workers
    .filter((w) => w.today_status === 'present')
    .reduce((sum, w) => sum + w.wage, 0);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  const logoutBtn = {
    label: 'Logout',
    onClick: handleLogout,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
  };

  return (
    <Layout title="Track X" showBack={false} actionBtn={logoutBtn}>
      <div className="section-pad">
        <div style={{ marginBottom: '16px' }}>
          <div className="greeting">
            {getGreeting()}, {user?.username}
          </div>
          <div className="greeting-sub">{getFormattedDate()}</div>
        </div>

        {/* Stats Row */}
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-label">Workers today</div>
            <div className="stat-val">{presentCount}</div>
            <div className="stat-sub">of {totalCount} present</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Daily expense</div>
            <div className="stat-val">{formatCurrency(projectedExpense)}</div>
            <div className="stat-sub">projected</div>
          </div>
        </div>

        {/* Today's Workers List Card */}
        <div className="card">
          <div className="card-title">Today's workers</div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <div className="spinner" style={{ width: 24, height: 24 }} />
            </div>
          ) : workers.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No workers added yet</p>
            </div>
          ) : (
            <div>
              {workers.map((w) => (
                <WorkerCard
                  key={w.id}
                  worker={w}
                  onClick={() => navigate(`/workers/${w.id}`)}
                  rightElement={
                    w.today_status === 'present' ? (
                      <span className="pill pill-green">Present</span>
                    ) : (
                      <span className="pill pill-red">Absent</span>
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card-title" style={{ marginBottom: '10px', marginTop: '20px' }}>
          Quick actions
        </div>
        <div className="dash-actions">
          <button className="dash-action" onClick={() => navigate('/workers')}>
            <span className="dash-action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className="dash-action-label">Workers</span>
            <span className="dash-action-sub">Manage team</span>
          </button>

          <button className="dash-action" onClick={() => navigate('/attendance')}>
            <span className="dash-action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
            <span className="dash-action-label">Attendance</span>
            <span className="dash-action-sub">Mark today</span>
          </button>

          <button className="dash-action" onClick={() => navigate('/salary')}>
            <span className="dash-action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1" />
                <path d="M12 1v6m0 6v4M4.22 4.22l4.24 4.24m3.08 3.08l4.24 4.24M1 12h6m6 0h4M4.22 19.78l4.24-4.24m3.08-3.08l4.24-4.24M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
              </svg>
            </span>
            <span className="dash-action-label">Salary</span>
            <span className="dash-action-sub">Calculate pay</span>
          </button>

          <button className="dash-action" onClick={() => navigate('/records')}>
            <span className="dash-action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="13" x2="12" y2="19" />
                <line x1="9" y1="16" x2="15" y2="16" />
              </svg>
            </span>
            <span className="dash-action-label">Records</span>
            <span className="dash-action-sub">Monthly summary</span>
          </button>
        </div>

        <div className="home-footer-note">
          Developed by{' '}
          <a
            href="https://www.instagram.com/_tech_x__?igsh=MWJ5N28xNTgxYXA3dQ=="
            target="_blank"
            rel="noopener noreferrer"
          >
            Tech X
          </a>
        </div>
      </div>
    </Layout>
  );
}
