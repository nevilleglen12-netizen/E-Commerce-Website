require('dotenv').config();
require('dotenv').config();
console.log('DATABASE_URL loaded:', process.env.DATABASE_URL ? 'YES' : 'NO — check .env location/name');
const { Pool } = require('pg');

// Supabase requires SSL. Prefer a single DATABASE_URL (from Supabase's
// "Connection string" tab) but fall back to discrete DB_* vars.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 150000
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 6543),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'postgres',
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });


function translatePlaceholders(text) {
  let result = '';
  let count = 0;

  for (const char of text) {
    if (char === '?') {
      count += 1;
      result += `$${count}`;
    } else {
      result += char;
    }
  }

  return result;
}

function normalizeResult(result, text) {
  const isSelect = /^(SELECT|WITH)\s+/i.test(text.trim());
  if (isSelect) {
    return [result.rows, result.fields || []];
  }

  const rowCount = Number(result.rowCount || 0);
  return [{
    insertId: result.rows?.[0]?.id ?? 0,
    affectedRows: rowCount,
    rowCount,
    rows: result.rows || []
  }, result.fields || []];
}

class PoolWrapper {
  async query(text, params = []) {
    const translated = translatePlaceholders(text);
    const result = await pool.query(translated, params);
    return normalizeResult(result, text);
  }

  async getConnection() {
    const client = await pool.connect();
    return {
      async query(text, params = []) {
        const translated = translatePlaceholders(text);
        const result = await client.query(translated, params);
        return normalizeResult(result, text);
      },
      async beginTransaction() {
        await client.query('BEGIN');
      },
      async commit() {
        await client.query('COMMIT');
      },
      async rollback() {
        await client.query('ROLLBACK');
      },
      release() {
        client.release();
      }
    };
  }

  async end() {
    await pool.end();
  }
}

module.exports = new PoolWrapper();
