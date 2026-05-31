const express = require('express');
const { z } = require('zod');
const db = require('../db/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

const PAYMENT_TYPES = ['Advance', 'Mid-month', 'Full payment', 'Overtime'];

function ownsWorker(workerId, userId) {
  return db
    .prepare('SELECT id FROM workers WHERE id = ? AND user_id = ?')
    .get(workerId, userId);
}

// ─── GET /api/payments/:workerId ──────────────────────────────
// Optional: ?year=&month= to filter by month
router.get('/:workerId', (req, res) => {
  const workerId = parseInt(req.params.workerId, 10);
  if (!ownsWorker(workerId, req.user.id)) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  const { year, month } = req.query;
  let query = 'SELECT * FROM payments WHERE worker_id = ?';
  const params = [workerId];

  if (year && month) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const prefix = `${y}-${String(m).padStart(2, '0')}-%`;
    query += ' AND paid_at LIKE ?';
    params.push(prefix);
  }

  const payments = db.prepare(query + ' ORDER BY paid_at DESC').all(...params);
  res.json(payments);
});

// ─── POST /api/payments ───────────────────────────────────────
// Record the payment and automatically update advance records.
router.post('/', (req, res, next) => {
  try {
    const schema = z.object({
      worker_id: z.number().int().positive(),
      amount:    z.number().int().min(1, 'Amount must be at least ₹1'),
      type:      z.enum(PAYMENT_TYPES, { errorMap: () => ({ message: 'Invalid payment type' }) }),
      note:      z.string().max(200).optional().default(''),
    });
    const data = schema.parse(req.body);

    if (!ownsWorker(data.worker_id, req.user.id)) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Record the payment
    const result = db
      .prepare('INSERT INTO payments (worker_id, amount, type, note) VALUES (?, ?, ?, ?)')
      .run(data.worker_id, data.amount, data.type, data.note);

    // If advance/mid-month, update this month's salary record's advance field
    if (data.type === 'Advance' || data.type === 'Mid-month') {
      const now = new Date();
      const year  = req.body.year ? parseInt(req.body.year, 10) : now.getFullYear();
      const month = req.body.month ? parseInt(req.body.month, 10) : (now.getMonth() + 1);

      db.prepare(
        `INSERT INTO salary_records (worker_id, year, month, advance)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(worker_id, year, month)
         DO UPDATE SET advance = advance + ?`
      ).run(data.worker_id, year, month, data.amount, data.amount);
    }

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(payment);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

module.exports = router;
