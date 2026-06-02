const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/trackx.db');
const resolvedPath = path.resolve(DB_PATH);

console.log(`[DB-DIAGNOSTIC] Database initialization started.`);
console.log(`[DB-DIAGNOSTIC] Configured database path: "${DB_PATH}"`);
console.log(`[DB-DIAGNOSTIC] Resolved absolute path: "${resolvedPath}"`);

// Ensure data directory exists
const dir = path.dirname(resolvedPath);
try {
  if (!fs.existsSync(dir)) {
    console.log(`[DB-DIAGNOSTIC] Creating data directory: "${dir}"`);
    fs.mkdirSync(dir, { recursive: true });
  }

  // Check write permissions on the directory
  const testFile = path.join(dir, '.write-test-file');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log(`[DB-DIAGNOSTIC] Directory writability: OK (verified write/delete operations)`);
} catch (fsErr) {
  console.error(`[DB-ERROR] Directory check/creation failed for: "${dir}". Error: ${fsErr.message}`);
}

// Warn if database is potentially ephemeral on Render
if (process.env.RENDER && !resolvedPath.startsWith('/var/data')) {
  console.warn(`[DB-WARNING] Running on Render, but DB_PATH does not point to "/var/data".`);
  console.warn(`             Data WILL be lost on every deploy, restart, or inactive spin-down!`);
} else if (process.env.RENDER) {
  console.log(`[DB-DIAGNOSTIC] Running on Render with database in "/var/data" path.`);
}

let db;
try {
  db = new Database(resolvedPath);
  console.log(`[DB-DIAGNOSTIC] SQLite instance successfully initialized.`);
} catch (dbErr) {
  console.error(`[DB-ERROR] Failed to open SQLite database file: ${dbErr.message}\n${dbErr.stack}`);
  process.exit(1);
}

// Performance and safety pragmas
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('temp_store = MEMORY');
db.pragma('cache_size = -16000'); // 16MB cache

// Run schema (idempotent — CREATE TABLE IF NOT EXISTS)
try {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  console.log(`[DB-DIAGNOSTIC] Schema schema.sql executed successfully (idempotent).`);
} catch (schemaErr) {
  console.error(`[DB-ERROR] Error executing schema.sql: ${schemaErr.message}\n${schemaErr.stack}`);
}

console.log(`✓ SQLite database ready: ${resolvedPath}`);

module.exports = db;
