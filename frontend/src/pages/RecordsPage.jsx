import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';
import { FileTextIcon } from '../components/Icons';
import { initials, MONTHS, formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function RecordsPage() {
  const [workersSummary, setWorkersSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11

  useEffect(() => {
    let active = true;
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(
          `/workers/summary?year=${year}&month=${month + 1}`
        );
        if (active) {
          setWorkersSummary(data);
        }
      } catch (err) {
        console.error('Error fetching records summary:', err);
        toast.error('Failed to load records for selected month');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchRecords();
    return () => {
      active = false;
    };
  }, [year, month]);

  const handleMonthChange = (delta) => {
    let newMonth = month + delta;
    let newYear = year;

    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }

    setYear(newYear);
    setMonth(newMonth);
  };

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

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

  return (
    <Layout title="Monthly Records" showBack={false}>
      <div className="section-pad">
        {/* Month/Year Navigator */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="calendar-header" style={{ marginBottom: 0 }}>
            <button className="cal-nav" onClick={() => handleMonthChange(-1)} aria-label="Previous Month">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="cal-month" style={{ fontWeight: 600 }}>
              {MONTHS[month]} {year}
            </span>
            <button className="cal-nav" onClick={() => handleMonthChange(1)} aria-label="Next Month">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Records List */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="spinner" />
          </div>
        ) : workersSummary.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <FileTextIcon style={{ width: 48, height: 48, margin: '0 auto', display: 'block', color: 'var(--text-secondary)' }} />
              </div>
              <h3>No records found</h3>
              <p>Add workers and track attendance to view monthly summaries.</p>
            </div>
          </div>
        ) : (
          <div>
            {workersSummary.map((w) => {
              const netPay = calculateNetPay(w);
              const totalDays = getDaysInMonth(year, month);
              const presentCount = w.present_days || 0;
              const attendancePct = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
              const rec = w.salary_record || {};

              return (
                <div className="card" key={w.id} style={{ marginBottom: '12px' }}>
                  {/* Worker Name & Pay */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div className="avatar">{initials(w.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {w.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {w.role} · {w.location}
                      </div>
                    </div>
                    <div style={{ fontSize: '17px', fontWeight: '600', color: 'var(--accent-dark)' }}>
                      {formatCurrency(netPay)}
                    </div>
                  </div>

                  {/* Attendance Progress bar */}
                  <div className="progress-bar-wrap" style={{ marginBottom: '8px' }}>
                    <div className="progress-bar" style={{ width: `${attendancePct}%` }} />
                  </div>

                  {/* Summary Footer */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>
                      {presentCount} / {totalDays} days · {attendancePct}% attendance
                    </span>
                    <span>
                      {MONTHS[month]} {year}
                    </span>
                  </div>

                  {/* Adjustment Badges */}
                  {(rec.overtime > 0 || rec.deduction > 0 || rec.advance > 0 || rec.manual_override !== null) && (
                    <div className="att-legend" style={{ marginTop: '10px', gap: '8px' }}>
                      {rec.overtime > 0 && (
                        <span className="pill pill-green">OT: {formatCurrency(rec.overtime)}</span>
                      )}
                      {rec.deduction > 0 && (
                        <span className="pill pill-red">Ded: -{formatCurrency(rec.deduction)}</span>
                      )}
                      {rec.advance > 0 && (
                        <span className="pill pill-amber">Adv: -{formatCurrency(rec.advance)}</span>
                      )}
                      {rec.manual_override !== null && rec.manual_override !== undefined && (
                        <span className="pill pill-blue">Override applied</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
