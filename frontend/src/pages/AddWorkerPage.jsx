import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';
import { ROLES } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function AddWorkerPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [role, setRole] = useState('Mason');
  const [location, setLocation] = useState('');
  const [wage, setWage] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Full name is required');
      return;
    }
    const wageNum = parseInt(wage, 10);
    if (!wage || isNaN(wageNum) || wageNum < 0) {
      setError('Please enter a valid daily wage (₹0 or more)');
      return;
    }

    try {
      setLoading(true);
      await api.post('/workers', {
        name: name.trim(),
        role,
        location: location.trim() || 'General',
        wage: wageNum,
        phone: phone.trim() || '-',
      });
      toast.success('Worker added successfully!');
      navigate('/workers');
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to add worker. Please try again.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Add Worker" showBack={true}>
      <div className="section-pad">
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ravi Kumar"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-input form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Location / Site</label>
              <input
                type="text"
                className="form-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Block A (defaults to General)"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Daily wage (₹)</label>
              <input
                type="number"
                className="form-input"
                value={wage}
                onChange={(e) => setWage(e.target.value)}
                placeholder="e.g. 700"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone number</label>
              <input
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210 (optional)"
                disabled={loading}
              />
            </div>

            {error && <div className="form-error" style={{ marginBottom: '14px' }}>{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <div className="spinner-sm" /> : 'Add worker'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
