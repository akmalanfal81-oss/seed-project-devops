# 🚀 Seed Project DevOps - UTS Containerization & Orchestration

Repositori ini dibuat untuk memenuhi Ujian Tengah Semester (UTS) mata kuliah DevOps. Proyek ini mendemonstrasikan implementasi **Multi-Stage Docker Build**, **Docker Compose Orchestration (5 Services)**, dan **Multi-Process Node.js** (REST API & Asynchronous Worker).

## 👥 Anggota Kelompok & Pembagian Tugas
1. **Akmal** (NIM: 42430041) - *Git Workflow, Backend Dockerfile, & Live Clean-boot*
2. **Yosua** (NIM: 42430006) - *Frontend Dockerfile, Nginx Reverse Proxy, & DB Migration*
3. **Daniel** (NIM: 42430017) - *Docker Compose Orchestration, Queue Logic, & Automated Test*

---

## 🏗️ Arsitektur Sistem
Aplikasi ini terdiri dari 5 layanan terisolasi yang berjalan di dalam *bridge network* Docker:
1. **`postgres`**: Database relasional (PostgreSQL 16-alpine) dengan *named volume* `pgdata`.
2. **`redis`**: Message broker (Redis 7-alpine) untuk antrean job (BullMQ).
3. **`api`**: REST API (Express.js) yang melayani request publik pada port `3000`.
4. **`worker`**: Proses *background* (Node.js) yang memproses antrean dari Redis secara asinkronus tanpa mengekspos port eksternal.
5. **`frontend`**: Web server ringan (Nginx Alpine) yang menyajikan SPA Vite dan bertindak sebagai *reverse proxy* ke backend.

---

## 📂 Struktur Direktori
```text
seed-project-devops/
├── backend/
│   ├── src/
│   │   ├── db/migrate.js
│   │   ├── routes/health.routes.js
│   │   ├── server.js
│   │   ├── worker.js
│   │   └── tests/health.test.js
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
├── deployments/
│   ├── .env.example
│   └── docker-compose.yml
└── README.md
