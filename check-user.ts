import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgrespassword',
  database: process.env.DATABASE_DB || 'flowcart',
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT id, email, role FROM users');
  console.log('All Users:', res.rows);
  await client.end();
}

run().catch(console.error);
