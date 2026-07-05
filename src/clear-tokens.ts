import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgrespassword',
    database: process.env.DATABASE_DB || 'flowcart',
    synchronize: false,
  });
  
  await ds.initialize();
  await ds.query('TRUNCATE TABLE refresh_tokens CASCADE');
  console.log('Cleared refresh tokens');
  await ds.destroy();
}

run().catch(console.error);
