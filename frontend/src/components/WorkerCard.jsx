import React from 'react';
import { initials, formatCurrency } from '../utils/helpers';

export default function WorkerCard({ worker, onClick, rightElement }) {
  return (
    <div className="worker-row" onClick={onClick}>
      <div className="avatar">{initials(worker.name)}</div>
      <div style={{ flex: 1 }}>
        <div className="worker-name">{worker.name}</div>
        <div className="worker-role">
          {worker.role} · {worker.location}
        </div>
      </div>
      <div>
        {rightElement !== undefined ? (
          rightElement
        ) : (
          <>
            <div className="worker-wage">{formatCurrency(worker.wage)}</div>
            <div className="worker-wage-label">per day</div>
          </>
        )}
      </div>
    </div>
  );
}
