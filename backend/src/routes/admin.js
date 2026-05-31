const express = require('express');
const db = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken, requireAdmin);

// ─── GET /api/admin/stats ─────────────────────────────────────
router.get('/stats', (req, res) => {
  const stats = {
    totalUsers: db.prepare('SELECT COUNT(*) AS c FROM users').get().c,
    totalWorkers: db.prepare('SELECT COUNT(*) AS c FROM workers').get().c,
    totalAttendance: db.prepare('SELECT COUNT(*) AS c FROM attendance').get().c,
    totalSalaryRecords: db.prepare('SELECT COUNT(*) AS c FROM salary_records').get().c,
    totalPayments: db.prepare('SELECT COUNT(*) AS c FROM payments').get().c,
    totalPaymentAmount: db
      .prepare('SELECT COALESCE(SUM(amount), 0) AS s FROM payments')
      .get().s,
  };
  res.json(stats);
});

// ─── GET /api/admin/users ─────────────────────────────────────
router.get('/users', (req, res) => {
  const users = db
    .prepare(
      `SELECT u.id, u.uid, u.username, u.is_admin, u.created_at,
              COUNT(DISTINCT w.id) AS worker_count
       FROM users u
       LEFT JOIN workers w ON w.user_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    )
    .all();
  res.json(users);
});

// ─── DELETE /api/admin/users/:id ─────────────────────────────
router.delete('/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // CASCADE delete removes workers → attendance, salary, payments automatically
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ message: 'User and all associated data deleted' });
});

// ─── GET /api/admin/export ────────────────────────────────────
router.get('/export', (req, res) => {
  const data = {
    exported_at: new Date().toISOString(),
    users: db
      .prepare('SELECT id, uid, username, is_admin, created_at FROM users')
      .all(),
    workers: db.prepare('SELECT * FROM workers').all(),
    attendance: db.prepare('SELECT * FROM attendance').all(),
    salary_records: db.prepare('SELECT * FROM salary_records').all(),
    payments: db.prepare('SELECT * FROM payments').all(),
  };
  res.setHeader('Content-Disposition', 'attachment; filename="trackx-export.json"');
  res.json(data);
});

module.exports = router;
