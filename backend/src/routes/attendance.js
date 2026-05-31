const express = require('express');
const { z } = require('zod');
const db = require('../db/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

/** Verify worker belongs to user */
function ownsWorker(workerId, userId) {
  return db
    .prepare('SELECT id FROM workers WHERE id = ? AND user_id = ?')
    .get(workerId, userId);
}

// ─── GET /api/attendance/:workerId ────────────────────────────
// Query params: ?year=2024&month=5  (both required for monthly view)
router.get('/:workerId', (req, res) => {
  const workerId = parseInt(req.params.workerId, 10);
  if (!ownsWorker(workerId, req.user.id)) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  const { year, month } = req.query;

  let records;
  if (year && month) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const prefix = `${y}-${String(m).padStart(2, '0')}-%`;
    records = db
      .prepare(
        "SELECT * FROM attendance WHERE worker_id = ? AND date LIKE ? ORDER BY date ASC"
      )
      .all(workerId, prefix);
  } else {
    records = db
      .prepare('SELECT * FROM attendance WHERE worker_id = ? ORDER BY date ASC')
      .all(workerId);
  }

  res.json(records);
});

// ─── POST /api/attendance ─────────────────────────────────────
// Upsert: sets (or toggles) attendance for a worker on a given date.
router.post('/', (req, res, next) => {
  try {
    const schema = z.object({
      worker_id: z.number().int().positive(),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
      status: z.enum(['present', 'absent']),
    });
    const { worker_id, date, status } = schema.parse(req.body);

    if (!ownsWorker(worker_id, req.user.id)) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Prevent marking future dates (allow up to 1 day ahead of server UTC to account for local timezone differences)
    const today = new Date();
    const maxAllowedDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (date > maxAllowedDate) {
      return res.status(400).json({ error: 'Cannot mark attendance for future dates' });
    }

    db.prepare(
      `INSERT INTO attendance (worker_id, date, status) VALUES (?, ?, ?)
       ON CONFLICT(worker_id, date) DO UPDATE SET status = excluded.status`
    ).run(worker_id, date, status);

    const record = db
      .prepare('SELECT * FROM attendance WHERE worker_id = ? AND date = ?')
      .get(worker_id, date);

    res.json(record);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

module.exports = router;
