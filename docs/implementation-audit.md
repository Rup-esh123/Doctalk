# DocTALK — Implementation Status and Project Audit Report

**Date of Audit:** October 27, 2026  
**Auditor:** Senior Software & QA Engineer  
**Repository:** `doctalk` (Monorepo: `@doctalk/api`, `@doctalk/web`, `@doctalk/shared`)  
**Commit Inspected:** `10058c2` (`feat: initial DocTALK healthcare platform implementation`)  

---

## Executive Summary

DocTALK has a comprehensive architectural specification (`architecture.md`, `flow.md`, `plan.md`, `progress.md`, `decisions.md`, `test-checklists.md`, `rollback.md`), an exhaustive 719-line Prisma schema, and a functional high-fidelity UI scaffold with a landing page, doctor directory, booking modal, and auth flows.

However, **the project is currently running on in-memory mock adapters and static fixtures**. The PostgreSQL database connection is unconfigured (no `.env` file, no Prisma migrations generated), external services (Razorpay, LiveKit, S3, Email) are simulated via mock providers, and several frontend builds and typechecks are broken due to minor path resolution errors and React hook rule violations. Furthermore, critical backend endpoints currently lack authentication guards.

---

## Section A: Overall Project Status

| Metric | Status | Details |
|---|---|---|
| **Overall Project Health** | ⚠️ Needs Remediation | Architecture is robust; core flows are prototyped; builds and database integration require fixes. |
| **Monorepo Structure** | 🟢 Healthy | Turborepo + pnpm workspace with `apps/api`, `apps/web`, and `packages/shared`. |
| **Unit Tests** | 🟢 Passing | 18/18 tests pass across API, web, and shared packages (`vitest`). |
| **Type Checking** | 🔴 Failing | `@doctalk/web` fails due to an incorrect import path in `src/app/auth/register/doctor/page.tsx`. |
| **Frontend Production Build** | 🔴 Failing | Webpack fails on Next.js build due to the broken import path. |
| **Backend Production Build** | 🟢 Passing | `tsc -p tsconfig.build.json` builds cleanly. |
| **Linting** | 🔴 Failing | `@doctalk/web` fails ESLint due to conditional hook call in `Navbar.tsx` and unescaped quotes. |
| **Database Persistence** | 🟡 Mock / In-Memory | NestJS services fall back to in-memory `Map` stores and static fixture data (`FICTIONAL_DOCTORS`). |
| **Prisma Migrations** | 🔴 Not Initialized | No `prisma/migrations` directory exists. `prisma validate` fails without `DATABASE_URL`. |
| **Current Implementation Phase** | **P0 (Foundations & Tooling) / Early P1** | Code exists for P1 and P2 features, but P0 exit criteria (clean build, CI, lint, DB migration) are not met. |

---

## Section B: Actual Repository Structure

```
doctalk/
├── .env.example                     # Environment template (Razorpay, LiveKit, DB, S3, Redis, Encryption)
├── .gitignore                       # Git ignore configuration
├── .npmrc                           # pnpm configuration
├── docker-compose.yml               # PostgreSQL 16, Redis 7, MinIO, Mailpit services
├── package.json                     # Root monorepo scripts (turbo build, dev, lint, test, typecheck)
├── pnpm-lock.yaml                   # Lockfile (pnpm v12.15.0)
├── pnpm-workspace.yaml              # Workspace declaration (apps/*, packages/*)
├── turbo.json                       # Turborepo task pipeline configuration
├── architecture.md                  # Comprehensive technical architecture
├── decisions.md                     # Architecture Decision Records (D-001 to D-039)
├── flow.md                          # Request execution traces (Flows 1-10)
├── handoff.md                       # Session handoff notes
├── plan.md                          # 9-Phase Master Plan (P0-P8, 166 steps)
├── progress.md                      # Progress tracker
├── rollback.md                      # Rollback strategies and runbooks
├── test-checklists.md               # Quality assurance verification checklists
│
├── apps/
│   ├── api/                         # NestJS 10 REST & WebSocket API (Port 4000, prefix /v1)
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # Complete PostgreSQL schema (719 lines)
│   │   │   └── seed.ts              # Database seeding script (stub)
│   │   ├── src/
│   │   │   ├── app.module.ts        # Root NestJS module (Throttler, Prisma, Providers, Modules)
│   │   │   ├── main.ts              # Entrypoint (CORS, CookieParser, GlobalFilters, GlobalInterceptors)
│   │   │   ├── config/env.ts        # Zod environment variable parsing with dev fallbacks
│   │   │   ├── common/              # Guards (JWT, Roles), Filters, Interceptors, Crypto, PrismaService
│   │   │   ├── modules/
│   │   │   │   ├── appointments/    # Hold creation, double-booking check, fee/commission snapshot, cancel
│   │   │   │   ├── auth/            # In-memory auth, scrypt password hashing, JWT cookies, session payload
│   │   │   │   ├── doctors/         # Fictional doctor directory, specialty filtering, IST slot calculation
│   │   │   │   ├── health/          # /health/liveness, /health/readiness endpoints
│   │   │   │   └── payments/        # Razorpay webhook intake, double-entry financial ledger
│   │   │   └── providers/           # Mock providers: AI, Email, Payment, Storage, Video
│   │   └── test/                    # Vitest unit specs (health.spec.ts, appointments.spec.ts)
│   │
│   └── web/                         # Next.js 14 App Router Frontend (Port 3000)
│       ├── messages/en.json         # English translation strings for next-intl
│       ├── next.config.mjs          # Next.js configuration
│       ├── tailwind.config.ts       # Tailwind CSS configuration
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx       # Root layout (Inter font, AuthProvider, EmergencyBanner, Footer)
│       │   │   ├── page.tsx         # Full responsive landing page, doctor directory, search & filters
│       │   │   ├── dashboard/       # Unified role-switched dashboard (/dashboard)
│       │   │   └── auth/
│       │   │       ├── login/       # Patient/Doctor login page with Zod validation
│       │   │       └── register/
│       │   │           ├── page.tsx # Patient registration page
│       │   │           └── doctor/  # Doctor multi-step onboarding wizard
│       │   ├── components/
│       │   │   ├── consult/         # DeviceCheckModal.tsx (simulated hardware pre-check)
│       │   │   ├── doctor/          # DoctorCard.tsx, BookingModal.tsx, DoctorProfileModal.tsx
│       │   │   └── layout/          # Navbar.tsx, Footer.tsx, EmergencyBanner.tsx
│       │   └── lib/                 # apiClient.ts, auth-context.tsx, auth-store.ts
│       └── test/                    # Vitest unit spec (DoctorCard.spec.ts)
│
└── packages/
    └── shared/                      # Isomorphic TypeScript domain library
        └── src/
            ├── constants/           # Error codes, system limits
            ├── enums/               # UserRole, DoctorStatus, AppointmentStatus, ConsultationMode, etc.
            ├── schemas/             # Zod schemas (auth, appointment, doctor, clinical, payment)
            ├── state/               # Finite state machine transition validator (`appointment.ts`)
            ├── types/               # TypeScript interfaces
            └── utils/               # Money formatting (paise to rupees), commission calculation
```

---

## Section C: Features That Work (With Verifiable Evidence)

1. **Monorepo Build & Dependency Orchestration (`packages/shared` & `@doctalk/api`)**
   - *Evidence:* `pnpm --filter @doctalk/shared build` and `pnpm --filter @doctalk/api build` execute and complete with exit code `0`. All workspace linkages (`workspace:*`) resolve correctly via pnpm 12.15.0.

2. **Domain Logic, Money Calculations & Finite State Machine Validation**
   - *Evidence:* `packages/shared/src/state/appointment.spec.ts` passes 6 tests validating strict state machine transitions (e.g., `HELD` -> `CONFIRMED`, `HELD` -> `EXPIRED`, rejecting illegal transitions like `EXPIRED` -> `CONFIRMED`). `packages/shared/src/utils/money.spec.ts` passes 5 tests validating paise/rupee arithmetic and commission splitting (15% independent, 25% managed).

3. **In-Memory Appointment Slot Hold & Double-Booking Prevention**
   - *Evidence:* `apps/api/test/appointments.spec.ts` executes 3 tests passing cleanly:
     - Atomically reserves a 10-minute hold with doctor fee and commission snapshots.
     - Enforces time-overlap check `(start1 < end2) && (start2 < end1)` to reject conflicting holds on the same doctor with `ConflictException (SLOT_TAKEN)`.
     - Validates refund policy logic (100% refund for cancellations ≥24h prior).

4. **API Health & Diagnostics Endpoints**
   - *Evidence:* `apps/api/test/health.spec.ts` executes 2 tests verifying `GET /v1/health/liveness` returns `{ status: 'ok', service: 'DocTALK API' }` and `GET /v1/health/readiness` inspects provider adapter configurations and feature flags.

5. **Responsive Landing Page & Doctor Directory UI**
   - *Evidence:* `apps/web/src/app/page.tsx` renders a modern landing page conforming to NMC guidelines, with live search filtering, specialty selection, language filtering, practice type filtering, emergency banner, trust badges, and slot booking triggers.

6. **Interactive Booking Modal & Hold Reservation Flow**
   - *Evidence:* `BookingModal.tsx` integrates with `apiClient.createAppointment()`, renders date selection, dynamic slot buttons, symptom intake, terms acceptance, and displays hold expiration countdown and mock payment order ID on success.

7. **Patient Registration & Login Form Validation**
   - *Evidence:* `LoginPage.tsx` and `PatientRegisterPage.tsx` implement Zod validation with `@hookform/resolvers/zod`, password strength evaluation, and call `apiClient.login()` / `apiClient.registerPatient()`.

---

## Section D: Features That Exist Only as UI or Mock Implementations

| Feature | Surface Area | Actual Implementation Status |
|---|---|---|
| **Doctor Directory Data** | `apps/api/src/modules/doctors/` | Sourced from static in-memory array `FICTIONAL_DOCTORS` (`fictional-doctors.data.ts`), not from PostgreSQL database. |
| **Authentication & User Store** | `apps/api/src/modules/auth/auth.service.ts` | Stored in an in-memory `Map<string, InMemoryUser>`. State is wiped whenever the API restarts. |
| **Appointment Records** | `apps/api/src/modules/appointments/appointments.service.ts` | Stored in an in-memory `Map<string, StoredAppointment>`. |
| **Payment Gateway** | `apps/api/src/providers/payment/mock-payment.provider.ts` | Generates random `order_mock_...` IDs. No connection to Razorpay API. Webhook accepts mock signature `test-signature`. |
| **Financial Ledger** | `apps/api/src/modules/payments/payments.service.ts` | Double-entry records are appended to an in-memory array (`ledgerEntries: StoredLedgerEntry[]`). |
| **Device Pre-Check** | `apps/web/src/components/consult/DeviceCheckModal.tsx` | Simulated diagnostic: uses a 1200ms `setTimeout` to flip states to "Ready" without calling `navigator.mediaDevices.getUserMedia()`. |
| **Doctor Onboarding** | `apps/web/src/app/auth/register/doctor/page.tsx` | UI form exists, but document upload is a mock input; registration saves into memory as `status: 'APPLIED'` with no review process. |
| **Doctor & Admin Dashboards** | `apps/web/src/app/dashboard/page.tsx` | Static UI shell switching on `role`. Stat cards show hardcoded numbers; all action buttons link to non-existent routes (`/doctor/*`, `/admin/*`). |
| **Internationalization** | `apps/web/messages/en.json` | English translation dictionary exists, but `next-intl` middleware and translation hooks are not wired up into the pages; UI strings are hardcoded in English. |
| **Storage & Media** | `apps/api/src/providers/storage/mock-storage.provider.ts` | Generates mock signed URLs (`http://localhost:9000/...`). S3/MinIO SDK is not invoked. |
| **Video Telemedicine** | `apps/api/src/providers/video/mock-video.provider.ts` | Returns mock token `mock_token_...`. LiveKit/100ms server is not connected. |
| **Transactional Email** | `apps/api/src/providers/email/mock-email.provider.ts` | Logs email payload to console; no SMTP or Resend dispatch. |
| **AI Assist** | `apps/api/src/providers/ai/mock-ai.provider.ts` | Returns static canned string; LLM APIs not connected. |

---

## Section E: Missing Features

The following specifications from the Master Plan have no backend or frontend implementation:

1. **Consultation Room**:
   - No WebRTC or LiveKit room component in Next.js (`apps/web/src/components/consult/` has only device check).
   - No audio-only fallback mode implementation.
   - No in-consultation chat socket room or attachment sharing.
2. **Clinical Encounters & Notes**:
   - No clinical note editor for doctors (`DoctorEncounterEditor`).
   - No encounter CRUD endpoints or database persistence in API.
   - No diagnosis coding or follow-up interval scheduling.
3. **Prescriptions**:
   - No prescription creation schema or UI.
   - No digital signing or cryptographic verification of prescription PDFs.
   - No patient prescription viewer or download endpoint.
4. **Doctor Verification Workflow**:
   - No admin review portal or verification queue (`/admin/verify`).
   - No API endpoints to inspect credentials, approve applications, or reject with reason.
5. **Background Jobs & Notification Pipeline**:
   - BullMQ and Redis connection are not implemented in the application code.
   - No background worker for expiring 10-minute appointment holds (currently only checked lazily on subsequent requests).
   - No notification dispatch for appointment reminders, SMS, or WhatsApp.
6. **Subscriptions & Reviews**:
   - No patient subscription plans or recurring billing logic.
   - No post-consultation rating and review submission flow.
7. **Database Migrations & Constraints**:
   - PostgreSQL schema exists in Prisma, but no database migrations have been generated or run against a real database.
   - PostgreSQL GiST exclusion constraint (`tstzrange`) for atomic double-booking prevention in the DB engine is not created.

---

## Section F: Build, Test and Quality Check Results

### 1. Dependency Installation
- **Status:** PASS
- **Command:** `pnpm -v` (version `12.15.0`)
- **Result:** All packages resolved and installed across the monorepo.

### 2. TypeScript Compilation (`pnpm typecheck`)
- **Status:** FAIL
- **Details:**
  - `@doctalk/shared`: PASS (`tsc --noEmit` clean).
  - `@doctalk/api`: PASS (`tsc --noEmit` clean).
  - `@doctalk/web`: **FAIL (Exit Code 2)**:
    ```
    src/app/auth/register/doctor/page.tsx(10,27): error TS2307: Cannot find module '../../../lib/api-client' or its corresponding type declarations.
    ```
    *(Path resolution error: `../../../lib/api-client` points to `apps/web/src/app/lib/api-client` instead of `apps/web/src/lib/api-client`).*

### 3. Production Builds
- **Backend (`@doctalk/api`):** PASS (`tsc -p tsconfig.build.json` succeeded).
- **Shared (`@doctalk/shared`):** PASS (`tsc` succeeded).
- **Frontend (`@doctalk/web`):** **FAIL (Exit Code 1)**:
    ```
    Failed to compile.
    ./src/app/auth/register/doctor/page.tsx
    Module not found: Can't resolve '../../../lib/api-client'
    > Build failed because of webpack errors
    ```

### 4. Automated Tests (`pnpm test`)
- **Status:** PASS (18 tests total across 5 test suites)
  - `packages/shared/src/state/appointment.spec.ts`: 6 passed
  - `packages/shared/src/utils/money.spec.ts`: 5 passed
  - `apps/api/test/health.spec.ts`: 2 passed
  - `apps/api/test/appointments.spec.ts`: 3 passed
  - `apps/web/test/DoctorCard.spec.ts`: 2 passed

### 5. Linting (`pnpm lint`)
- **Status:** FAIL
  - `@doctalk/api`: PASS (dummy script `echo "API lint clean"`).
  - `@doctalk/shared`: PASS (dummy script `echo "Shared lint clean"`).
  - `@doctalk/web`: **FAIL (Exit Code 1)**:
    - **Fatal Rule Error:** `react-hooks/rules-of-hooks` in `src/components/layout/Navbar.tsx:37:25` (`React Hook "useAuthSafe" is called conditionally inside a try block`).
    - **Syntax Errors:** `react/no-unescaped-entities` in `login/page.tsx` (lines 71, 240, 244), `register/doctor/page.tsx` (lines 129, 380), `register/page.tsx` (lines 116, 289, 295).
    - **Warnings:** `@next/next/no-page-custom-font` in `layout.tsx`, `react-hooks/exhaustive-deps` in `page.tsx`, `@next/next/no-img-element` in `DoctorCard.tsx` and `DoctorProfileModal.tsx`.

### 6. Database Connectivity & Migrations
- **Status:** BLOCKED / NOT INITIALIZED
  - Local Docker engine is not running (`docker ps` failed: command not found).
  - No `.env` file exists in root or `apps/api` (`DATABASE_URL` is missing).
  - `pnpm --filter @doctalk/api prisma validate` failed with error `P1012: Environment variable not found: DATABASE_URL`.
  - No migration directory exists (`apps/api/prisma/migrations` does not exist).

---

## Section G: Critical Bugs, Security Concerns and Blockers

### Critical Security Vulnerabilities
1. **Unauthenticated Appointments Endpoints**:
   - `POST /v1/appointments` has no `JwtAuthGuard`. If unauthenticated, it silently injects a hardcoded patient ID: `'usr-patient-0000000-0000-0000-0000-000000000001'`.
   - `GET /v1/appointments/:id` has no authentication or authorization checks. Any user can view any patient's appointment details.
   - `POST /v1/appointments/:id/cancel` has no authentication check and hardcodes the cancelling party to `'PATIENT'`.
2. **Publicly Exposed Financial Ledger**:
   - `GET /v1/payments/ledger` is completely unauthenticated. Anyone on the internet can read platform revenue, doctor payout amounts, and appointment payment records.
3. **Razorpay Webhook Signature Bypass**:
   - In `PaymentsController.handleWebhook()`: `const sig = signature || 'test-signature';`.
   - In `MockPaymentProvider.verifyWebhookSignature()`: `return signature === expected || signature === 'test-signature';`.
   - Anyone sending a POST request to `/v1/payments/webhook` without an `x-razorpay-signature` header passes signature verification and triggers payment confirmations and ledger credits.
4. **Webhooks Using Unreliable JSON Serialization**:
   - `PaymentsController` serializes the already-parsed body using `JSON.stringify(body)` instead of comparing against the raw HTTP request stream buffer. This will fail standard HMAC-SHA256 signature verification in production with real Razorpay payloads.
5. **Hardcoded Fallback Credentials in Source**:
   - `apps/api/src/modules/auth/auth.service.ts` seeds hardcoded admin credentials: `admin@doctalk.in` / `DocTalkAdmin@2026`.
   - `apps/api/src/config/env.ts` provides fallback JWT secrets and encryption keys which remain active even if `NODE_ENV === 'production'`.

### Functional Bugs
1. **Broken Relative Import in Doctor Registration**:
   - `apps/web/src/app/auth/register/doctor/page.tsx:10`: `import { apiClient } from '../../../lib/api-client'` breaks Next.js build and typechecking. Must be `../../../../lib/api-client` (or `@/lib/api-client`).
2. **Conditional Hook Call in Navbar**:
   - `apps/web/src/components/layout/Navbar.tsx:37`: `useAuthSafe()` is invoked inside a `try {}` block, violating React's Rules of Hooks and breaking Next.js production linting.
3. **Lazy Expiration of Appointment Holds**:
   - Holds are only marked `EXPIRED` if another patient attempts to book the exact same overlapping slot. There is no background worker or scheduled job to expire holds and release slots after 10 minutes.

---

## Section H: Missing External Credentials and Service Configuration

The project currently operates entirely on mock adapters. The following configurations are missing from active environment files:

| Service | Environment Variable | Required For | Current Dev Fallback |
|---|---|---|---|
| **PostgreSQL Database** | `DATABASE_URL` | True persistence, ACID transactions, GiST exclusion constraints | In-memory `Map` (lost on restart) |
| **Redis Cache / Queue** | `REDIS_URL` | BullMQ hold expiration worker, rate limiting, pub/sub | None (in-memory maps) |
| **Razorpay Payment Gateway** | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Real INR payments, UPI/cards, order verification | `MockPaymentProvider` |
| **LiveKit / 100ms Video** | `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | WebRTC video/audio consult rooms, token generation | `MockVideoProvider` |
| **S3-Compatible Object Storage** | `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY` | Private clinical document uploads, presigned URLs | `MockStorageProvider` |
| **Transactional Email** | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` or `RESEND_API_KEY` | Email verification, login alerts, appointment confirmation | `MockEmailProvider` (console log) |
| **Clinical Encryption Key** | `CLINICAL_ENCRYPTION_KEY` | 32-byte AES-256-GCM field encryption for sensitive PHI | Static mock key in `env.ts` |

*(Note: No real secret values are exposed in this report).*

---

## Section I: Current Implementation Phase

### **Current Phase: P0 (Foundations, Compliance Setup & Tooling) / Early P1**

**Rationale:**
Although substantial UI components and API modules exist for P1 (Identity) and P2 (Discovery and Booking), **Phase P0 cannot be marked complete** because:
1. CI checks fail (`pnpm typecheck`, `pnpm lint`, and `pnpm --filter @doctalk/web build` fail).
2. The database layer is uninitialized (no PostgreSQL connection, no initial Prisma migration created).
3. The API runs in local in-memory mock mode.

Under the project's strict quality rubric, a phase is only exited when all verifications and automated quality gates pass.

---

## Section J: The Three Highest-Priority Next Steps

1. **Fix Frontend Build & Lint Blockers (Immediate):**
   - Correct the import path in `apps/web/src/app/auth/register/doctor/page.tsx` (`../../../../lib/api-client`).
   - Fix the `rules-of-hooks` violation in `apps/web/src/components/layout/Navbar.tsx` by using `useAuth()` directly without dynamic conditional calls.
   - Fix unescaped quote entities in login and registration pages so `pnpm typecheck`, `pnpm lint`, and `pnpm build` pass with exit code `0`.

2. **Initialize PostgreSQL Database & Prisma Migrations:**
   - Create a local `.env` file from `.env.example`.
   - Ensure PostgreSQL is accessible (via local Docker container or hosted test instance).
   - Run `prisma migrate dev --name init_schema` to generate the initial database migration from `schema.prisma`.
   - Seed the initial verification policy documents and specialties.

3. **Secure API Endpoints & Connect Services to Prisma:**
   - Apply `JwtAuthGuard` and `RolesGuard` to `POST /v1/appointments`, `GET /v1/appointments/:id`, `POST /v1/appointments/:id/cancel`, and `GET /v1/payments/ledger`.
   - Remove the webhook signature bypass (`sig = signature || 'test-signature'`) and capture raw request buffers for HMAC verification.
   - Transition `AuthService`, `DoctorsService`, and `AppointmentsService` from in-memory Maps to Prisma queries.

---

## Section K: Recommended Next Implementation Task

### **Task: FE-P0.2 & BE-P0.1 Monorepo Quality Gate Remediation & Initial Migration**

Consistent with the Master Build Plan (`plan.md`), the recommended immediate task is:
1. Fix the two file errors in `@doctalk/web` (`doctor/page.tsx` and `Navbar.tsx`) so that `pnpm typecheck`, `pnpm lint`, and `pnpm build` pass cleanly across the entire monorepo.
2. Establish a valid `.env` configuration for local development and run the initial Prisma migration (`prisma migrate dev`) to verify database schema integrity against PostgreSQL.
3. Lock in green builds across all packages before proceeding to Phase P1 database-backed authentication.

---
*Report generated and saved to `docs/implementation-audit.md`.*
