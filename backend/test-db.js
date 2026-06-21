import pg from 'pg';
const { Pool } = pg;

async function test(url) {
  console.log('Testing', url);
  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });
  try {
    const res = await pool.query('SELECT 1 as result');
    console.log('SUCCESS!', res.rows);
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    pool.end();
  }
}

test('postgresql://postgres:seceaids2025@db.voacoygfptrdsncyaqej.supabase.co:5432/postgres');
