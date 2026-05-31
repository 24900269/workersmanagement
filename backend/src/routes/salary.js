const express = require('express');
const { z } = require('zod');
const db = require('../db/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

function ownsWorker(workerId, userId) {
  return db
    .prepare('SELECT id FROM workers WHERE id = ? AND user_id = ?')
    .get(workerId, userId);
}

// ─── GET /api/salary/:workerId ────────────────────────────────
// With ?year=&month= → returns single record or null
// Without query params → returns all records for that worker
router.get('/:workerId', (req, res) => {
  const workerId = parseInt(req.params.workerId, 10);
  if (!ownsWorker(workerId, req.user.id)) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  const { year, month } = req.query;
  if (year && month) {
    const record = db
      .prepare(
        'SELECT * FROM salary_records WHERE worker_id = ? AND year = ? AND month = ?'
      )
      .get(workerId, parseInt(year, 10), parseInt(month, 10));
    return res.json(record || null);
  }

  const records = db
    .prepare(
      'SELECT * FROM salary_records WHERE worker_id = ? ORDER BY year DESC, month DESC'
    )
    .all(workerId);
  res.json(records);
});

// ─── POST /api/salary ─────────────────────────────────────────
// Upsert salary adjustments for worker/year/month
router.post('/', (req, res, next) => {
  try {
    const schema = z.object({
      worker_id:       z.number().int().positive(),
      year:            z.number().int().min(2020).max(2100),
      month:           z.number().int().min(1).max(12),
      overtime:        z.number().int().min(0).default(0),
      deduction:       z.number().int().min(0).default(0),
      advance:         z.number().int().min(0).default(0),
      manual_override: z.number().int().min(0).nullable().optional(),
    });
    const data = schema.parse(req.body);

    if (!ownsWorker(data.worker_id, req.user.id)) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    db.prepare(
      `INSERT INTO salary_records (worker_id, year, month, overtime, deduction, advance, manual_override)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(worker_id, year, month) DO UPDATE SET
         overtime        = excluded.overtime,
         deduction       = excluded.deduction,
         advance         = excluded.advance,
         manual_override = excluded.manual_override`
    ).run(
      data.worker_id,
      data.year,
      data.month,
      data.overtime,
      data.deduction,
      data.advance,
      data.manual_override ?? null
    );

    const record = db
      .prepare(
        'SELECT * FROM salary_records WHERE worker_id = ? AND year = ? AND month = ?'
      )
      .get(data.worker_id, data.year, data.month);

    res.json(record);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

module.exports = router;
