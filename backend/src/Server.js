import express from 'express';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { fileURLToPath } from 'url';
import pg from 'pg';
import healthRoutes from './routes/health.routes.js';

const { Pool } = pg;

const app = express();
app.use(express.json());

// [DANIEL] Inisialisasi koneksi Redis. maxRetriesPerRequest: null wajib untuk BullMQ.
const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT || 6379),
  maxRetriesPerRequest: null,
});
redisConnection.on('error', (err) => {
  console.error('[api] Redis error:', err.message);
});

// [DANIEL] Membuat antrean (Queue) bernama 'transactions' yang terhubung ke Redis.
const transactionQueue = new Queue('transactions', { connection: redisConnection });

// [DANIEL] Inisialisasi koneksi Database PostgreSQL menggunakan library 'pg'.
const dbPool = new Pool({ connectionString: process.env.DATABASE_URL });

// --- Health routes ---
app.use('/healthz', healthRoutes({ redis: redisConnection }));

// --- POST /api/transactions (enqueue) ---
app.post('/api/transactions', async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'amount harus berupa angka > 0' });
    }
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'description wajib diisi' });
    }

    // [DANIEL] Endpoint ini tidak menunggu proses insert ke database selesai.
    // Data hanya dimasukkan ke antrean Redis (Queue) agar request user tidak memblokir (non-blocking).
    const job = await transactionQueue.add(
      'process-transaction',
      { amount, description },
      {
        // [DANIEL] Jika gagal, coba 3x dengan jeda eksponensial (2 detik, 4 detik, dst).
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 100,
      }
    );

    // [DANIEL] Mengembalikan HTTP 202 (Accepted), menandakan data sudah masuk antrean.
    return res.status(202).json({
      message: 'Transaksi diterima, sedang diproses secara asinkronus.',
      jobId: job.id,
    });
  } catch (err) {
    console.error('[api] Gagal enqueue transaksi:', err);
    return res.status(500).json({ error: 'Gagal memasukkan transaksi ke queue' });
  }
});

// --- GET /api/transactions (list untuk frontend) ---
// [DANIEL] Endpoint untuk frontend mengambil daftar transaksi dari PostgreSQL.
// Ini memastikan frontend menampilkan data yang sudah diproses oleh worker.
app.get('/api/transactions', async (req, res) => {
  try {
    const result = await dbPool.query(
      `SELECT id, amount, description, status, created_at, processed_at
         FROM transactions
        ORDER BY id DESC
        LIMIT 50`
    );
    return res.json({ data: result.rows });
  } catch (err) {
    console.error('[api] Gagal query transaksi:', err);
    return res.status(500).json({ error: err.message });
  }
});

const PORT = Number(process.env.PORT || 3000);
const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] === __filename;

if (isMain) {
  app.listen(PORT, () => {
    console.log(`[api] REST API berjalan di port ${PORT}`);
  });
}

export { app };