import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import SalaryBreakdown from '../components/SalaryBreakdown';
import PaymentModal from '../components/PaymentModal';
import api from '../api/client';
import { AlertTriangleIcon } from '../components/Icons';
import { initials, formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function WorkerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const workerId = parseInt(id, 10);

  const [worker, setWorker] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [salaryRecord, setSalaryRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-indexed for backend API

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [workerRes, attRes, salRes] = await Promise.all([
        api.get(`/workers/${workerId}`),
        api.get(`/attendance/${workerId}?year=${currentYear}&month=${currentMonth}`),
        api.get(`/salary/${workerId}?year=${currentYear}&month=${currentMonth}`),
      ]);
      setWorker(workerRes.data);
      setAttendance(attRes.data);
      setSalaryRecord(salRes.data);
    } catch (err) {
      console.error('Error fetching worker details:', err);
      toast.error('Failed to load worker details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [workerId]);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to remove ${worker?.name}? All related attendance, salary, and payment records will be permanently deleted.`)) {
      try {
        await api.delete(`/workers/${workerId}`);
        toast.success('Worker removed successfully');
        navigate('/workers');
      } catch (err) {
        console.error('Error deleting worker:', err);
        toast.error('Failed to remove worker');
      }
    }
  };

  const handleSavePayment = async (paymentData) => {
    try {
      setIsSavingPayment(true);
      await api.post('/payments', {
        worker_id: workerId,
        year: currentYear,
        month: currentMonth,
        ...paymentData,
      });
      toast.success('Payment recorded successfully!');
      setIsPayModalOpen(false);
      // Refresh data to update salary breakdowns (the advance field is updated by backend)
      await fetchAllData();
    } catch (err) {
      console.error('Error recording payment:', err);
      toast.error(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setIsSavingPayment(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Worker Details" showBack={true}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <div className="spinner" />
        </div>
      </Layout>
    );
  }

  if (!worker) {
    return (
      <Layout title="Worker Details" showBack={true}>
        <div className="section-pad">
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <AlertTriangleIcon style={{ width: 48, height: 48, margin: '0 auto', display: 'block', color: 'var(--text-secondary)' }} />
              </div>
              <h3>Worker not found</h3>
              <p>The worker details could not be retrieved.</p>
              <button className="btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/workers')}>
                Back to Workers
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Calculate Attendance Stats
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const presentDays = attendance.filter((r) => r.status === 'present').length;
  const daysElapsed = currentYear === today.getFullYear() && (currentMonth - 1) === today.getMonth()
    ? today.getDate()
    : daysInMonth;
  const attendancePct = daysElapsed > 0 ? Math.round((presentDays / daysElapsed) * 100) : 0;

  return (
    <Layout title="Worker Details" showBack={true}>
      <div className="section-pad">
        {/* Worker Info Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div className="avatar avatar-lg">{initials(worker.name)}</div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)' }}>{worker.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{worker.role}</div>
            </div>
          </div>
          <div className="sal-row">
            <span className="sal-key">Location / Site</span>
            <span className="sal-val">{worker.location}</span>
          </div>
          <div className="sal-row">
            <span className="sal-key">Phone</span>
            <span className="sal-val">{worker.phone}</span>
          </div>
          <div className="sal-row">
            <span className="sal-key">Daily wage</span>
            <span className="sal-val">{formatCurrency(worker.wage)}</span>
          </div>
        </div>

        {/* Attendance Summary Card */}
        <div className="card">
          <div className="card-title">This month attendance</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Days present</span>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>
              {presentDays} / {daysElapsed} days
            </span>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-bar" style={{ width: `${attendancePct}%` }} />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            {attendancePct}% attendance this month
          </div>
        </div>

        {/* Salary Summary Card */}
        <div className="card">
          <div className="card-title">Salary this month</div>
          <SalaryBreakdown
            presentDays={presentDays}
            wage={worker.wage}
            overtime={salaryRecord?.overtime || 0}
            deduction={salaryRecord?.deduction || 0}
            advance={salaryRecord?.advance || 0}
            manualOverride={salaryRecord?.manual_override}
          />
        </div>

        {/* Action Buttons */}
        <button className="btn-secondary" style={{ marginTop: '8px' }} onClick={() => setIsPayModalOpen(true)}>
          Record payment
        </button>

        <button
          className="btn-secondary"
          style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onClick={() => navigate(`/payments/${workerId}`)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Payment history
        </button>

        <button className="btn-danger" style={{ marginTop: '10px' }} onClick={handleDelete}>
          Remove worker
        </button>
      </div>

      <PaymentModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        onSave={handleSavePayment}
        isSaving={isSavingPayment}
      />
    </Layout>
  );
}
