import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PaymentModal from '../components/PaymentModal';
import api from '../api/client';
import { WalletIcon } from '../components/Icons';
import { initials, formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function PaymentsPage() {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const wId = workerId ? parseInt(workerId, 10) : null;

  const [worker, setWorker] = useState(null);
  const [payments, setPayments] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchPaymentsData = async () => {
      try {
        setLoading(true);
        if (wId) {
          const [workerRes, paymentsRes] = await Promise.all([
            api.get(`/workers/${wId}`),
            api.get(`/payments/${wId}`),
          ]);
          if (active) {
            setWorker(workerRes.data);
            setPayments(paymentsRes.data);
          }
        } else {
          // If no specific worker, fetch all workers so they can pick one
          const { data } = await api.get('/workers');
          if (active) {
            setWorkers(data);
          }
        }
      } catch (err) {
        console.error('Error fetching payments page data:', err);
        toast.error('Failed to load payment logs');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchPaymentsData();
    return () => {
      active = false;
    };
  }, [wId]);

  const handleRecordPayment = async (paymentData) => {
    try {
      setIsSaving(true);
      const today = new Date();
      await api.post('/payments', {
        worker_id: wId,
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        ...paymentData,
      });
      toast.success('Payment recorded successfully');
      setIsPayModalOpen(false);

      // Refresh payments list
      const { data } = await api.get(`/payments/${wId}`);
      setPayments(data);
    } catch (err) {
      console.error('Error adding payment:', err);
      toast.error(err.response?.data?.error || 'Failed to save payment');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ─── Render list of workers to select one (if no wId) ───
  if (!wId) {
    return (
      <Layout title="Payment Logs" showBack={false}>
        <div className="section-pad">
          <div className="card-title" style={{ marginBottom: '10px' }}>
            Select worker to view payment logs
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div className="spinner" />
            </div>
          ) : workers.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <WalletIcon style={{ width: 48, height: 48, margin: '0 auto', display: 'block', color: 'var(--text-secondary)' }} />
                </div>
                <h3>No workers added</h3>
                <p>Register workers first to start recording payment details.</p>
                <button
                  className="btn-primary"
                  style={{ marginTop: '16px' }}
                  onClick={() => navigate('/workers/add')}
                >
                  Add Worker
                </button>
              </div>
            </div>
          ) : (
            <div>
              {workers.map((w) => (
                <div
                  key={w.id}
                  className="month-card"
                  onClick={() => navigate(`/payments/${w.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="avatar">{initials(w.name)}</div>
                  <div className="month-info">
                    <div className="month-name">{w.name}</div>
                    <div className="month-detail">{w.role} · {w.location}</div>
                  </div>
                  <div className="month-salary" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    View History &gt;
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // ─── Render payment history for specific worker ───
  const payBtn = {
    label: 'Record',
    onClick: () => setIsPayModalOpen(true),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  };

  return (
    <Layout title="Payment History" showBack={true} actionBtn={payBtn}>
      <div className="section-pad">
        {/* Worker summary header */}
        {worker && (
          <div className="card" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="avatar">{initials(worker.name)}</div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{worker.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{worker.role} · {worker.location}</div>
            </div>
          </div>
        )}

        {/* Payments list card */}
        <div className="card">
          <div className="card-title">All transactions ({payments.length})</div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
              <div className="spinner" style={{ width: 24, height: 24 }} />
            </div>
          ) : payments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <WalletIcon style={{ width: 48, height: 48, margin: '0 auto', display: 'block', color: 'var(--text-secondary)' }} />
              </div>
              <h3>No payments recorded</h3>
              <p>Record a payment for this worker using the "Record" button above.</p>
            </div>
          ) : (
            <div>
              {payments.map((p) => {
                let pillClass = 'pill pill-green'; // default
                if (p.type === 'Advance') pillClass = 'pill pill-amber';
                if (p.type === 'Deduction') pillClass = 'pill pill-red';
                if (p.type === 'Mid-month') pillClass = 'pill pill-blue';

                return (
                  <div key={p.id} className="payment-item">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={pillClass}>{p.type}</span>
                      </div>
                      {p.note && <div className="payment-note">{p.note}</div>}
                      <div className="payment-date" style={{ marginTop: '4px' }}>
                        {formatDate(p.paid_at)}
                      </div>
                    </div>
                    <div className="payment-amount">{formatCurrency(p.amount)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <PaymentModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        onSave={handleRecordPayment}
        isSaving={isSaving}
      />
    </Layout>
  );
}
