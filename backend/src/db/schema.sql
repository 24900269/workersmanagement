-- ═══════════════════════════════════════════════════════════
-- TrackX Database Schema
-- ═══════════════════════════════════════════════════════════

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  uid           TEXT    UNIQUE NOT NULL,           -- Public user ID e.g. "TXU-8F3K2P"
  username      TEXT    UNIQUE NOT NULL,
  password_hash TEXT    NOT NULL,
  is_admin      INTEGER NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Workers table (scoped per user)
CREATE TABLE IF NOT EXISTS workers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,
  role       TEXT    NOT NULL DEFAULT 'Labour',
  location   TEXT    NOT NULL DEFAULT 'General',
  wage       INTEGER NOT NULL DEFAULT 0,
  phone      TEXT    NOT NULL DEFAULT '-',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Attendance records (one row per worker per day)
CREATE TABLE IF NOT EXISTS attendance (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  date      TEXT    NOT NULL,     -- Format: YYYY-MM-DD
  status    TEXT    NOT NULL CHECK(status IN ('present', 'absent')),
  UNIQUE(worker_id, date)
);

-- Monthly salary adjustments
CREATE TABLE IF NOT EXISTS salary_records (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id       INTEGER NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  year            INTEGER NOT NULL,
  month           INTEGER NOT NULL,
  overtime        INTEGER NOT NULL DEFAULT 0,
  deduction       INTEGER NOT NULL DEFAULT 0,
  advance         INTEGER NOT NULL DEFAULT 0,
  manual_override INTEGER,         -- NULL means auto-calculate
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(worker_id, year, month)
);

-- Payment history
CREATE TABLE IF NOT EXISTS payments (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER  NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  amount    INTEGER  NOT NULL,
  type      TEXT     NOT NULL,    -- 'Advance' | 'Mid-month' | 'Full payment' | 'Overtime'
  note      TEXT     NOT NULL DEFAULT '',
  paid_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════
-- Indexes for performance
-- ═══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_workers_user_id
  ON workers(user_id);

CREATE INDEX IF NOT EXISTS idx_attendance_worker_date
  ON attendance(worker_id, date);

CREATE INDEX IF NOT EXISTS idx_salary_worker_year_month
  ON salary_records(worker_id, year, month);

CREATE INDEX IF NOT EXISTS idx_payments_worker_id
  ON payments(worker_id);
