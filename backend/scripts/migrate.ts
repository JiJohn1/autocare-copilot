import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function migrate() {
  const pool = new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? 'autocare',
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
  });

  try {
    console.log('Running migration...');

    await pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source     TEXT NOT NULL,
        title      TEXT NOT NULL,
        content    TEXT NOT NULL,
        embedding  vector(1536),
        metadata   JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ivfflat 인덱스는 수천 건 이상에서만 효과적.
    // 소규모 데이터셋에서는 sequential scan이 더 정확하므로 인덱스 생성 생략.

    console.log('Migration complete.');
  } finally {
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
