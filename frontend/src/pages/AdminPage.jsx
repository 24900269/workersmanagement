import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      toast.error('Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeleteUser = async (userToDelete) => {
    if (userToDelete.id === currentUser.id) {
      toast.error('Cannot delete your own account');
      return;
    }

    if (
      window.confirm(
        `DANGER: Remove user "${userToDelete.username}" (${userToDelete.uid})?\nThis will delete their account and all their workers, attendance, salary adjustments, and payment records permanently.`
      )
    ) {
      try {
        await api.delete(`/admin/users/${userToDelete.id}`);
        toast.success('User and data deleted successfully');
        // Refresh
        fetchAdminData();
      } catch (err) {
        console.error('Error deleting user:', err);
        toast.error(err.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      const response = await api.get('/admin/export', { responseType: 'blob' });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `trackx-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Backup export downloaded!');
    } catch (err) {
      console.error('Error exporting backup:', err);
      toast.error('Failed to export data backup');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Layout title="Admin Dashboard" showBack={false}>
      <div className="section-pad">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* Admin Stats Grid */}
            <div className="admin-stat-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-val">{stats?.totalUsers}</div>
                <div className="admin-stat-label">Total Users</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-val">{stats?.totalWorkers}</div>
                <div className="admin-stat-label">Total Workers</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-val">{stats?.totalPayments}</div>
                <div className="admin-stat-label">Transactions</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-val" style={{ fontSize: '18px', lineHeight: '39px' }}>
                  {formatCurrency(stats?.totalPaymentAmount)}
                </div>
                <div className="admin-stat-label">Total Volume</div>
              </div>
            </div>

            {/* Backup / Export Option */}
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-title">Data Administration</div>
              <button className="btn-secondary" onClick={handleExportData} disabled={exporting}>
                {exporting ? 'Exporting...' : 'Download JSON Data Backup'}
              </button>
            </div>

            {/* Users Management */}
            <div className="card">
              <div className="card-title">System Users ({users.length})</div>
              <div style={{ overflowX: 'auto' }}>
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>UID / Site</th>
                      <th>Registered</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{u.username}</div>
                          {u.is_admin === 1 && <span className="pill pill-green" style={{ fontSize: '9px', padding: '1px 5px', marginTop: '2px' }}>Admin</span>}
                        </td>
                        <td>
                          <div style={{ fontSize: '12px', letterSpacing: '0.5px' }}>{u.uid}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {u.worker_count} workers
                          </div>
                        </td>
                        <td style={{ fontSize: '12px' }}>{formatDate(u.created_at)}</td>
                        <td>
                          {u.id !== currentUser.id ? (
                            <button className="delete-btn" onClick={() => handleDeleteUser(u)}>
                              Delete
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '8px' }}>
                              You
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
