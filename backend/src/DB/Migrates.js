import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SQL = `
CREATE TABLE IF NOT EXISTS transactions (
  id            SERIAL PRIMARY KEY,
  amount        NUMERIC(12, 2) NOT NULL,
  description   TEXT NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  processed_at  TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_transactions_status     ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
`;

async function main() {
    console.log('[migrate] Menghubungkan ke database...');
    const client = await pool.connect();
    try {
        console.log('[migrate] Menjalankan migrasi skema...');
        await client.query(SQL);
        console.log('[migrate] Migrasi berhasil.');
    } catch (err) {
        console.error('[migrate] Migrasi gagal:', err);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

main();