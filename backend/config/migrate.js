import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl || dbUrl.includes('[YOUR-PASSWORD]')) {
  console.error('Error: DATABASE_URL is not set or contains the [YOUR-PASSWORD] placeholder in backend/.env');
  process.exit(1);
}

const runMigrations = async () => {
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();
    
    // 1. Run Schema
    const schemaPath = path.resolve('../database/schema.sql');
    console.log(`Reading schema script from: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Applying database tables, functions, triggers, and security rules...');
    await client.query(schemaSql);
    console.log('Database schema migrations applied successfully.');

    // 2. Run Seeds
    const seedsPath = path.resolve('../database/seeds.sql');
    console.log(`Reading seeds script from: ${seedsPath}`);
    const seedsSql = fs.readFileSync(seedsPath, 'utf8');
    
    console.log('Applying database factors, default achievements, badges, challenges, and educational guides...');
    await client.query(seedsSql);
    console.log('Database seed metrics populated successfully.');

  } catch (error) {
    console.error('Database migration failed:', error);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
};

runMigrations();
