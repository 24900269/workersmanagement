import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Calendar from '../components/Calendar';
import api from '../api/client';
import { CalendarIcon } from '../components/Icons';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function AttendancePage() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11

  // Fetch all workers
  useEffect(() => {
    let active = true;
    const fetchWorkers = async () => {
      try {
        setLoadingWorkers(true);
        const { data } = await api.get('/workers');
        if (active) {
          setWorkers(data);
          if (data.length > 0) {
            setSelectedWorkerId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching workers for attendance:', err);
        toast.error('Failed to load workers');
      } finally {
        if (active) {
          setLoadingWorkers(false);
        }
      }
    };
    fetchWorkers();
    return () => {
      active = false;
    };
  }, []);

  // Fetch attendance records for the selected worker and month
  useEffect(() => {
    if (!selectedWorkerId) return;

    let active = true;
    const fetchAttendance = async () => {
      try {
        setLoadingAttendance(true);
        // API expectations: month is 1-12
        const { data } = await api.get(
          `/attendance/${selectedWorkerId}?year=${year}&month=${month + 1}`
        );
        if (active) {
          const map = {};
          data.forEach((r) => {
            map[r.date] = r.status;
          });
          setAttendanceMap(map);
        }
      } catch (err) {
        console.error('Error fetching attendance:', err);
        toast.error('Failed to load attendance history');
      } finally {
        if (active) {
          setLoadingAttendance(false);
        }
      }
    };

    fetchAttendance();
    return () => {
      active = false;
    };
  }, [selectedWorkerId, year, month]);

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

  const handleToggleDate = async (dateStr) => {
    if (!selectedWorkerId) return;

    const currentStatus = attendanceMap[dateStr];
    // Toggle: if present, make absent; otherwise make present
    const newStatus = currentStatus === 'present' ? 'absent' : 'present';

    // Optimistic UI Update
    setAttendanceMap((prev) => ({
      ...prev,
      [dateStr]: newStatus,
    }));

    try {
      await api.post('/attendance', {
        worker_id: selectedWorkerId,
        date: dateStr,
        status: newStatus,
      });
    } catch (err) {
      console.error('Error saving attendance:', err);
      toast.error('Failed to save attendance change');
      // Rollback optimistic update
      setAttendanceMap((prev) => ({
        ...prev,
        [dateStr]: currentStatus,
      }));
    }
  };

  const selectedWorker = workers.find((w) => w.id === selectedWorkerId);

  // Compute summary stats
  const presentDays = Object.values(attendanceMap).filter((status) => status === 'present').length;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const absentDays = daysInMonth - presentDays;
  const baseSalary = selectedWorker ? presentDays * selectedWorker.wage : 0;

  return (
    <Layout title="Attendance" showBack={false}>
      <div className="section-pad">
        {loadingWorkers ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="spinner" />
          </div>
        ) : workers.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <CalendarIcon style={{ width: 48, height: 48, margin: '0 auto', display: 'block', color: 'var(--text-secondary)' }} />
              </div>
              <h3>No workers added</h3>
              <p>You need to add a worker before you can track attendance.</p>
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
          <>
            {/* Worker Chip Selection */}
            <div className="card-title">Select worker</div>
            <div className="att-worker-sel">
              {workers.map((w) => (
                <button
                  key={w.id}
                  className={`att-chip ${selectedWorkerId === w.id ? 'selected' : ''}`}
                  onClick={() => setSelectedWorkerId(w.id)}
                >
                  {w.name.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Calendar */}
            {selectedWorkerId && (
              <Calendar
                year={year}
                month={month}
                onChangeMonth={handleMonthChange}
                attendance={attendanceMap}
                onToggleDate={handleToggleDate}
              />
            )}

            {/* Monthly Summary */}
            {selectedWorker && (
              <div className="card" style={{ marginTop: '12px' }}>
                <div className="card-title">Monthly summary</div>
                {loadingAttendance ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                    <div className="spinner" style={{ width: 18, height: 18 }} />
                  </div>
                ) : (
                  <div>
                    <div className="sal-row">
                      <span className="sal-key">Present days</span>
                      <span className="sal-val" style={{ color: 'var(--accent-dark)', fontWeight: 600 }}>
                        {presentDays}
                      </span>
                    </div>
                    <div className="sal-row">
                      <span className="sal-key">Absent days</span>
                      <span className="sal-val">{absentDays}</span>
                    </div>
                    <div className="sal-row">
                      <span className="sal-key">Base salary</span>
                      <span className="sal-val" style={{ fontWeight: 600 }}>
                        {formatCurrency(baseSalary)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
