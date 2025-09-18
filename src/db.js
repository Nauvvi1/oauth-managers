
const { Pool } = require('pg');
const cfg = require('./config');

const pool = new Pool({
  connectionString: cfg.databaseUrl,
});

pool.on('error', (err) => {
  console.error('Unexpected PG error', err);
  process.exit(-1);
});

async function query(text, params) {
  return pool.query(text, params);
}

async function getClient() {
  return pool.connect();
}

module.exports = { pool, query, getClient };
