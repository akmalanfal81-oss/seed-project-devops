import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import pg from 'pg';

const { Pool } = pg;

const redisConnection = new IORedis({
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT || 6379),
    maxRetriesPerRequest: null,
});
redisConnection.on('error', (err) => {
    console.error('[worker] Redis error:', err.message);
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const worker = new Worker(
    'transactions',
    async (job) => {
        const { amount, description } = job.data;
        console.log(`[worker] Memproses job ${job.id}: amount=${amount}`);

        const result = await pool.query(
            `INSERT INTO transactions (amount, description, status, processed_at)
       VALUES ($1, $2, 'completed', NOW())
       RETURNING id`,
            [amount, description]
        );

        console.log(`[worker] Job ${job.id} SELESAI. Transaksi ID=${result.rows[0].id}`);
        return { transactionId: result.rows[0].id };
    },
    { connection: redisConnection, concurrency: 5 }
);

worker.on('completed', (job) => {
    console.log(`[worker] Job ${job.id} completed.`);
});

worker.on('failed', (job, err) => {
    console.error(`[worker] Job ${job?.id} failed:`, err.message);
});

console.log('[worker] Menunggu job dari queue "transactions"...');

process.on('SIGTERM', async () => {
    console.log('[worker] SIGTERM diterima, menutup worker...');
    await worker.close();
    await pool.end();
    await redisConnection.quit();
    process.exit(0);
});