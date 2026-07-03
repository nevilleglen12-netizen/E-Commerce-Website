require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'shopease',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
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
