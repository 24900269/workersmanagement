import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import SalaryBreakdown from '../components/SalaryBreakdown';
import api from '../api/client';
import { AlertTriangleIcon } from '../components/Icons';
import { initials, MONTHS, formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function SalaryDetailPage() {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const wId = parseInt(workerId, 10);

  const [worker, setWorker] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Adjustment form states
  const [overtime, setOvertime] = useState('');
  const [deduction, setDeduction] = useState('');
  const [advance, setAdvance] = useState('');
  const [manualOverride, setManualOverride] = useState('');

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-indexed

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [workerRes, attRes, salRes] = await Promise.all([
          api.get(`/workers/${wId}`),
          api.get(`/attendance/${wId}?year=${currentYear}&month=${currentMonth}`),
          api.get(`/salary/${wId}?year=${currentYear}&month=${currentMonth}`),
        ]);

        setWorker(workerRes.data);
        setAttendance(attRes.data);

        // Prepopulate adjustments if salary record exists
        if (salRes.data) {
          setOvertime(salRes.data.overtime || '');
          setDeduction(salRes.data.deduction || '');
          setAdvance(salRes.data.advance || '');
          setManualOverride(
            salRes.data.manual_override !== null && salRes.data.manual_override !== undefined
              ? salRes.data.manual_override
              : ''
          );
        }
      } catch (err) {
        console.error('Error loading salary detail data:', err);
        toast.error('Failed to load salary record details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [wId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const otVal = parseInt(overtime, 10) || 0;
      const dedVal = parseInt(deduction, 10) || 0;
      const advVal = parseInt(advance, 10) || 0;
      const manualVal = manualOverride !== '' ? parseInt(manualOverride, 10) : null;

      await api.post('/salary', {
        worker_id: wId,
        year: currentYear,
        month: currentMonth,
        overtime: otVal,
        deduction: dedVal,
        advance: advVal,
        manual_override: manualVal,
      });

      toast.success('Salary adjustments saved!');
      navigate('/salary');
    } catch (err) {
      console.error('Error saving salary record:', err);
      toast.error(err.response?.data?.error || 'Failed to save salary adjustments');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Salary Details" showBack={true}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <div className="spinner" />
        </div>
      </Layout>
    );
  }

  if (!worker) {
    return (
      <Layout title="Salary Details" showBack={true}>
        <div className="section-pad">
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <AlertTriangleIcon style={{ width: 48, height: 48, margin: '0 auto', display: 'block', color: 'var(--text-secondary)' }} />
              </div>
              <h3>Worker not found</h3>
              <p>The worker details could not be retrieved.</p>
              <button className="btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/salary')}>
                Back to Salary
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const presentDays = attendance.filter((r) => r.status === 'present').length;

  return (
    <Layout title="Salary Details" showBack={true}>
      <div className="section-pad">
        {/* Worker Info card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="avatar">{initials(worker.name)}</div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{worker.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {worker.role} · {MONTHS[currentMonth - 1]} {currentYear}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {presentDays} days present · {formatCurrency(worker.wage)}/day
              </div>
            </div>
          </div>
        </div>

        {/* Adjustments Form card */}
        <div className="card">
          <div className="card-title">Adjustments</div>

          <div className="form-group">
            <label className="form-label">Overtime (₹)</label>
            <input
              type="number"
              className="form-input"
              value={overtime}
              onChange={(e) => setOvertime(e.target.value)}
              placeholder="0"
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Deductions (₹)</label>
            <input
              type="number"
              className="form-input"
              value={deduction}
              onChange={(e) => setDeduction(e.target.value)}
              placeholder="0"
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Advance paid (₹)</label>
            <input
              type="number"
              className="form-input"
              value={advance}
              onChange={(e) => setAdvance(e.target.value)}
              placeholder="0"
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Manual override total (₹){' '}
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                (optional)
              </span>
            </label>
            <input
              type="number"
              className="form-input"
              value={manualOverride}
              onChange={(e) => setManualOverride(e.target.value)}
              placeholder="Leave blank to auto-calculate"
              disabled={saving}
            />
          </div>
        </div>

        {/* Live Calculation card */}
        <div className="card">
          <div className="card-title">Final calculation</div>
          <SalaryBreakdown
            presentDays={presentDays}
            wage={worker.wage}
            overtime={parseInt(overtime, 10) || 0}
            deduction={parseInt(deduction, 10) || 0}
            advance={parseInt(advance, 10) || 0}
            manualOverride={manualOverride !== '' ? parseInt(manualOverride, 10) : null}
          />
        </div>

        <button className="btn-primary" style={{ marginTop: '8px' }} onClick={handleSave} disabled={saving}>
          {saving ? <div className="spinner-sm" /> : 'Save salary record'}
        </button>
      </div>
    </Layout>
  );
}
