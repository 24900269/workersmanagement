import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';
import { WalletIcon } from '../components/Icons';
import { initials, formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function SalaryPage() {
  const navigate = useNavigate();
  const [workersSummary, setWorkersSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-indexed for backend

  useEffect(() => {
    let active = true;
    const fetchSalaryList = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(
          `/workers/summary?year=${currentYear}&month=${currentMonth}`
        );
        if (active) {
          setWorkersSummary(data);
        }
      } catch (err) {
        console.error('Error fetching salary summaries:', err);
        toast.error('Failed to load salary calculations');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchSalaryList();
    return () => {
      active = false;
    };
  }, []);

  const calculateNetPay = (w) => {
    const base = (w.present_days || 0) * w.wage;
    const rec = w.salary_record || {};
    const ot = rec.overtime || 0;
    const ded = rec.deduction || 0;
    const adv = rec.advance || 0;
    const final =
      rec.manual_override !== null && rec.manual_override !== undefined
        ? rec.manual_override
        : base + ot - ded - adv;
    return Math.max(0, final);
  };

  return (
    <Layout title="Salary" showBack={false}>
      <div className="section-pad">
        <div className="card-title" style={{ marginBottom: '10px' }}>
          Select worker to calculate pay
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="spinner" />
          </div>
        ) : workersSummary.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <WalletIcon style={{ width: 48, height: 48, margin: '0 auto', display: 'block', color: 'var(--text-secondary)' }} />
              </div>
              <h3>No workers registered</h3>
              <p>Add a worker first to start processing their payroll.</p>
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
            {workersSummary.map((w) => (
              <div
                key={w.id}
                className="month-card"
                onClick={() => navigate(`/salary/${w.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="avatar">{initials(w.name)}</div>
                <div className="month-info">
                  <div className="month-name">{w.name}</div>
                  <div className="month-detail">
                    {w.present_days || 0} days present · {formatCurrency(w.wage)}/day
                  </div>
                </div>
                <div className="month-salary">{formatCurrency(calculateNetPay(w))}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
