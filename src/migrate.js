
const fs = require('fs');
const path = require('path');
const { query } = require('./db');

(async () => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '001_init.sql'), 'utf-8');
    await query(sql);
    console.log('Migration applied ✔');
    process.exit(0);
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
})();
