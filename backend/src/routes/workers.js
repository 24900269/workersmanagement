const express = require('express');
const { z } = require('zod');
const db = require('../db/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// ─── Helpers ─────────────────────────────────────────────────
const ROLES = ['Mason', 'Helper', 'Carpenter', 'Electrician', 'Plumber', 'Supervisor', 'Labour'];

const workerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  role: z.enum(ROLES, { errorMap: () => ({ message: 'Invalid role' }) }),
  location: z.string().max(100).optional().default('General'),
  wage: z.number().int().min(0).max(999999),
  phone: z.string().max(20).optional().default('-'),
});

/** Verify the worker belongs to the requesting user */
function ownsWorker(workerId, userId) {
  return db
    .prepare('SELECT id FROM workers WHERE id = ? AND user_id = ?')
    .get(workerId, userId);
}

// ─── GET /api/workers ─────────────────────────────────────────
router.get('/', (req, res) => {
  const workers = db
    .prepare('SELECT * FROM workers WHERE user_id = ? ORDER BY name ASC')
    .all(req.user.id);
  res.json(workers);
});

// ─── GET /api/workers/today ───────────────────────────────────
// Returns all workers with today's attendance status attached.
router.get('/today', (req, res) => {
  let today = req.query.date;
  if (!today || !/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    today = new Date().toISOString().split('T')[0];
  }
  const workers = db
    .prepare(
      `SELECT w.*, COALESCE(a.status, 'absent') AS today_status
       FROM workers w
       LEFT JOIN attendance a ON a.worker_id = w.id AND a.date = ?
       WHERE w.user_id = ?
       ORDER BY w.name ASC`
    )
    .all(today, req.user.id);
  res.json(workers);
});

// ─── GET /api/workers/summary ─────────────────────────────────
// Returns all workers with presence count + salary record for a given month.
router.get('/summary', (req, res) => {
  const { year, month } = req.query;
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);

  if (!y || !m || m < 1 || m > 12) {
    return res.status(400).json({ error: 'Invalid year or month' });
  }

  const prefix = `${y}-${String(m).padStart(2, '0')}-%`;

  const workers = db
    .prepare('SELECT * FROM workers WHERE user_id = ? ORDER BY name ASC')
    .all(req.user.id);

  const getPresentDays = db.prepare(
    `SELECT COUNT(*) AS count FROM attendance
     WHERE worker_id = ? AND status = 'present'
       AND date LIKE ?`
  );
  const getSalaryRecord = db.prepare(
    'SELECT * FROM salary_records WHERE worker_id = ? AND year = ? AND month = ?'
  );

  const result = workers.map((w) => {
    const { count: present_days } = getPresentDays.get(w.id, prefix);
    const salary_record = getSalaryRecord.get(w.id, y, m) || null;
    return { ...w, present_days, salary_record };
  });

  res.json(result);
});

// ─── GET /api/workers/:id ─────────────────────────────────────
router.get('/:id', (req, res) => {
  const worker = db
    .prepare('SELECT * FROM workers WHERE id = ? AND user_id = ?')
    .get(parseInt(req.params.id, 10), req.user.id);
  if (!worker) return res.status(404).json({ error: 'Worker not found' });
  res.json(worker);
});

// ─── POST /api/workers ────────────────────────────────────────
router.post('/', (req, res, next) => {
  try {
    const data = workerSchema.parse(req.body);
    const result = db
      .prepare(
        'INSERT INTO workers (user_id, name, role, location, wage, phone) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(req.user.id, data.name, data.role, data.location, data.wage, data.phone);
    const worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(worker);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

// ─── PUT /api/workers/:id ─────────────────────────────────────
router.put('/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!ownsWorker(id, req.user.id)) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    const data = workerSchema.parse(req.body);
    db.prepare(
      'UPDATE workers SET name=?, role=?, location=?, wage=?, phone=? WHERE id=? AND user_id=?'
    ).run(data.name, data.role, data.location, data.wage, data.phone, id, req.user.id);
    const worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(id);
    res.json(worker);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

// ─── DELETE /api/workers/:id ──────────────────────────────────
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!ownsWorker(id, req.user.id)) {
    return res.status(404).json({ error: 'Worker not found' });
  }
  db.prepare('DELETE FROM workers WHERE id = ? AND user_id = ?').run(id, req.user.id);
  res.json({ message: 'Worker removed successfully' });
});

module.exports = router;
