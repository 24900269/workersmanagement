import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import WorkerCard from '../components/WorkerCard';
import { WorkerIcon } from '../components/Icons';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function WorkersPage() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchWorkers = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/workers');
        if (active) {
          setWorkers(data);
        }
      } catch (err) {
        console.error('Error fetching workers:', err);
        toast.error('Failed to load workers');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchWorkers();
    return () => {
      active = false;
    };
  }, []);

  const filteredWorkers = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.role.toLowerCase().includes(search.toLowerCase()) ||
      w.location.toLowerCase().includes(search.toLowerCase())
  );

  const addBtn = {
    label: 'Add',
    onClick: () => navigate('/workers/add'),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  };

  return (
    <Layout title="Workers" showBack={false} actionBtn={addBtn}>
      <div className="section-pad">
        {/* Search Bar */}
        <div className="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search workers by name, role, or site..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Workers List */}
        <div className="card">
          <div className="card-title">All workers ({filteredWorkers.length})</div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
              <div className="spinner" style={{ width: 24, height: 24 }} />
            </div>
          ) : filteredWorkers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <WorkerIcon style={{ width: 48, height: 48, margin: '0 auto', display: 'block', color: 'var(--text-secondary)' }} />
              </div>
              <h3>No workers found</h3>
              <p>
                {search
                  ? 'No workers match your search query.'
                  : 'Get started by adding a worker to your team.'}
              </p>
            </div>
          ) : (
            <div>
              {filteredWorkers.map((w) => (
                <WorkerCard key={w.id} worker={w} onClick={() => navigate(`/workers/${w.id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
