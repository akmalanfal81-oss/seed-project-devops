import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';

// Mock ioredis & bullmq SEBELUM import server.js
vi.mock('ioredis', () => {
    return {
        default: class MockRedis {
            constructor() { }
            ping() { return Promise.resolve('PONG'); }
            on() { }
            quit() { return Promise.resolve(); }
        },
    };
});

vi.mock('bullmq', () => {
    return {
        Queue: class MockQueue {
            constructor() { }
            add() { return Promise.resolve({ id: 'job-test-1' }); }
        },
        Worker: class MockWorker { },
    };
});

describe('Health & API endpoints', () => {
    let app;

    beforeAll(async () => {
        const mod = await import('../server.js');
        app = mod.app;
    });

    it('GET /healthz/live → 200 alive', async () => {
        const res = await request(app).get('/healthz/live');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('alive');
    });

    it('GET /healthz/ready → 200 ready', async () => {
        const res = await request(app).get('/healthz/ready');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ready');
    });

    it('POST /api/transactions tanpa amount → 400', async () => {
        const res = await request(app)
            .post('/api/transactions')
            .send({ description: 'test' });
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('amount');
    });

    it('POST /api/transactions tanpa description → 400', async () => {
        const res = await request(app)
            .post('/api/transactions')
            .send({ amount: 100 });
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('description');
    });

    it('POST /api/transactions payload valid → 202 + jobId', async () => {
        const res = await request(app)
            .post('/api/transactions')
            .send({ amount: 150000, description: 'Pembelian lisensi' });
        expect(res.status).toBe(202);
        expect(res.body.jobId).toBeDefined();
    });
});