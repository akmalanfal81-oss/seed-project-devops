import { Router } from 'express';

export default function healthRoutes({ redis }) {
    const router = Router();

    router.get('/live', (req, res) => {
        res.status(200).json({ status: 'alive', uptime: process.uptime() });
    });

    router.get('/ready', async (req, res) => {
        try {
            await redis.ping();
            res.status(200).json({ status: 'ready', checks: { redis: 'ok' } });
        } catch (err) {
            res.status(503).json({ status: 'not-ready', error: err.message });
        }
    });

    return router;
}