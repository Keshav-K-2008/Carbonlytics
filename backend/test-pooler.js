import pg from 'pg';
const { Pool } = pg;

async function test(url) {
  console.log('Testing', url);
  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });
  try {
    const res = await pool.query('SELECT 1 as result');
    console.log('SUCCESS!');
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    pool.end();
  }
}

async function run() {
  await test('postgresql://postgres.voacoygfptrdsncyaqej:seceaids2025@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres');
  await test('postgresql://postgres.voacoygfptrdsncyaqej:seceaids2025@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres');
  await test('postgresql://postgres:seceaids2025@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?options=-c%20search_path%3Dvoacoygfptrdsncyaqej');
}
run();
