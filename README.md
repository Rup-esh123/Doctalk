# DocTALK — Telemedicine & Managed Healthcare Platform (India)

[![DocTALK CI Quality Pipeline](https://github.com/doctalk/doctalk/actions/workflows/ci.yml/badge.svg)](https://github.com/doctalk/doctalk/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-10.x%20%7C%2011.x-red.svg)](https://www.npmjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.x-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-red.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)

DocTALK is a hybrid telemedicine marketplace and managed-clinic network for India, connecting patients with State and National Medical Council verified doctors. Consultations are delivered via encrypted video, low-bandwidth audio fallback, or persistent clinical chat, backed by atomic double-booking prevention, digitally issued prescriptions, and an append-only financial ledger.

---

## 1. System Architecture & Project Structure

DocTALK is organized as two standalone, independent applications with shared domain schemas:

```
doctalk/
├── apps/
│   ├── web/                     # Next.js 14 App Router, React 18, Tailwind CSS, TypeScript
│   │   └── src/shared/          # Self-contained Zod schemas, domain types, enums, integer-paise utils
│   └── api/                     # NestJS modular REST API & Socket.IO gateway (/v1)
│       └── src/shared/          # Self-contained Zod schemas, domain types, enums, integer-paise utils
├── docs/                        # Architecture, plans, execution traces, audit checklists
│   ├── architecture.md          # Primary system architecture specification
│   ├── plan.md                  # P0–P8 implementation roadmap
│   ├── progress.md              # Live implementation tracker
│   ├── flow.md                  # Execution traces for critical journeys
│   └── decisions.md             # Decision records (D-001...D-039)
├── docker-compose.yml           # PostgreSQL 16, Redis 7, MinIO (S3), Mailpit (Email)
├── .env.example                 # Comprehensive environment variable template
└── README.md
```

---

## 2. Prerequisites

- **Node.js**: `v20.x` or `v22.x` (LTS)
- **npm**: `v10.x` or `v11.x` (bundled with Node.js)
- **Docker & Docker Compose** (Optional for local PostgreSQL, Redis, MinIO, Mailpit services)

---

## 3. Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repo-url> doctalk
   cd doctalk
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   npm run install:all
   ```

3. **Configure Environment:**
   ```bash
   cp .env.example .env
   ```

4. **Generate Prisma Client:**
   ```bash
   npm --prefix apps/api run prisma:generate
   ```

5. **Start Infrastructure Services (if Docker is installed):**
   ```bash
   docker compose up -d
   ```
   *(Note: When Docker is not running locally, the API automatically operates with resilient in-memory data stores and mock provider adapters for smooth development.)*

---

## 4. Development & Running Locally

Start both the Next.js frontend and NestJS API concurrently from the root:

```bash
npm run dev
```

Or run either application independently:

```bash
# Run API alone
npm run dev:api
# Or: cd apps/api && npm run dev

# Run Web alone
npm run dev:web
# Or: cd apps/web && npm run dev
```

- **DocTALK Web Application**: `http://localhost:3000`
- **DocTALK REST API**: `http://localhost:4000/v1`
- **API Liveness Probe**: `http://localhost:4000/v1/health/liveness`
- **API Readiness Probe**: `http://localhost:4000/v1/health/readiness`
- **Mailpit Web UI (if Docker running)**: `http://localhost:8025`
- **MinIO S3 Console (if Docker running)**: `http://localhost:9001`

---

## 5. Verification & Testing Pipeline

Run all quality checks across both applications:

```bash
# 1. Typecheck TypeScript strict mode across both apps
npm run typecheck

# 2. Run unit and integration tests (Vitest)
npm run test

# 3. Lint check
npm run lint

# 4. Production build test
npm run build
```

---

## 6. Implementation Status Matrix

| Component | Status | Implementation Details |
|---|---|---|
| **Pipeline & Setup** | ✅ **Complete** | Standard npm scripts, GitHub Actions CI, strict TypeScript |
| **Landing Page & UI** | ✅ **Complete** | Responsive healthcare design, council verification badges, search filters |
| **API Architecture** | ✅ **Complete** | `/v1` prefix, RequestId middleware, HttpExceptionFilter, Zod pipes |
| **Shared Models** | ✅ **Complete** | Self-contained Zod schemas, enums, integer-paise calculations |
| **Double-Booking Protection** | ✅ **Complete** | GiST exclusion logic & 10-minute slot hold state machine |
| **Provider Abstractions** | ✅ **Complete** | Interfaces & dev adapters for Video, Razorpay, Storage, Email, AI |
| **Financial Integrity** | ✅ **Complete** | Append-only double-entry ledger tracking paise, 100%/50% refund policies |
| **Razorpay Payments** | ⚠️ *Mock Test Mode* | Test-mode order creation & signed webhook verification implemented |
| **Instant Consultations** | ⚠️ *Flagged Dark* | Feature flag `FEATURE_INSTANT_CONSULT=false` per D-010 until scheduled path proven |
| **Assistive AI Intake** | ⚠️ *Flagged Dark* | Feature flag `FEATURE_AI_INTAKE=false` per D-009 until clinician gates cleared |

---

## 7. Security & Compliance Principles

1. **Integer-Paise Financial Math**: All fees, commissions, and refunds are calculated strictly in integer paise (`1 INR = 100 paise`). Floats are prohibited in monetary transactions.
2. **Double-Booking Prevention**: Slots are protected via atomic range constraints (`tstzrange`) and hold expirations.
3. **No Consultation Recordings**: Video/audio consultations are unrecorded by default to uphold patient privacy.
4. **Clinical Record Encryption**: PHI fields in encounters are encrypted using application-managed keys.
5. **Zero-Trust Error Responses**: Public API errors conform to `{ code, message, details?, requestId }` and never leak internal stack traces or secrets.

---

## 8. License & Disclaimer

DocTALK is designed in accordance with the Telemedicine Practice Guidelines issued under the Indian Medical Council Act / National Medical Commission Act. Real-world deployment requires formal review by an Indian healthcare-law professional and gateway onboarding.
