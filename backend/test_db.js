import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
console.log('Testing connection to:', dbUrl ? dbUrl.split('@')[1] : 'undefined');

if (!dbUrl) {
  console.log('No DATABASE_URL found in .env');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

try {
  await client.connect();
  console.log('Successfully connected to database!');
  
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  
  console.log('Tables found in database:');
  tablesRes.rows.forEach(row => console.log(' -', row.table_name));
  
} catch (err) {
  console.error('Database connection failed:', err);
} finally {
  await client.end();
}
