import React, { useState, useEffect } from 'react';

export default function PaymentModal({ isOpen, onClose, onSave, isSaving = false }) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('Advance');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Reset inputs when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setType('Advance');
      setNote('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = parseInt(amount, 10);
    if (!amount || isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount greater than ₹0');
      return;
    }
    setError('');
    onSave({ amount: amt, type, note });
  };

  return (
    <div className={`modal-overlay open`} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" onClick={onClose} style={{ cursor: 'pointer' }} />
        <div className="modal-title">Record payment</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Amount paid (₹)</label>
            <input
              className="form-input"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 2000"
              disabled={isSaving}
            />
            {error && <div className="form-error">{error}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Payment type</label>
            <select
              className="form-input form-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={isSaving}
            >
              <option value="Advance">Advance</option>
              <option value="Mid-month">Mid-month</option>
              <option value="Full payment">Full payment</option>
              <option value="Overtime">Overtime</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <input
              className="form-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Advance for festival"
              disabled={isSaving}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isSaving}>
            {isSaving ? <div className="spinner-sm" /> : 'Save payment'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ marginTop: '8px' }}
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
