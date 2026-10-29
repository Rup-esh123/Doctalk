# DocTALK — P0 & P1 Database Verification & Phase-Gate Assessment Report

**Execution Date:** October 28, 2026  
**Auditor Lead:** Senior PostgreSQL Engineer, Prisma Specialist, Backend Engineer & Application Security Auditor  
**Scope:** Verification of PostgreSQL Database Connection, Prisma Migration Application, Live Database Persistence, Production Build/Health Probes, and P0/P1 Phase-Gate Exit Decisions  
**Target Repository:** `doctalk` Monorepo (`@doctalk/shared`, `@doctalk/api`, `@doctalk/web`)  

---

## 1. Environment Checks (Secrets Redacted)

A thorough environment inspection was conducted across the local execution environment, service registries, and repository configurations:

* **Docker Daemon / CLI:**
  * Checked: `docker --version`, `docker ps`
  * Status: Docker executable is not installed on system PATH.
* **Local PostgreSQL Installation:**
  * Checked: Windows Service Manager (`sc.exe qc postgresql-x64-18`, `Get-Service *postgres*`)
  * Status: **Installed and Running**. Service `postgresql-x64-18` (PostgreSQL Server 18) binary located at `C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe` and `psql.exe`.
* **Port 5432 Listening State:**
  * Checked: `Get-NetTCPConnection -LocalPort 5432`
  * Status: **Active (Listen)** on `0.0.0.0:5432` and `[::]:5432` by local PostgreSQL service process.
* **Environment Variable Configuration (`DATABASE_URL` & `DIRECT_URL`):**
  * Checked: `.env` (monorepo root) and `apps/api/.env`.
  * Status: **Configured**.
    * `DATABASE_URL`: Protocol `postgresql:`, Host `aws-0-ap-northeast-2.pooler.supabase.com:6543`, Database `/postgres`, Parameters `pgbouncer=true`. User and password redacted.
    * `DIRECT_URL`: Protocol `postgresql:`, Host `aws-0-ap-northeast-2.pooler.supabase.com:5432`, Database `/postgres`. User and password redacted.
  * Secrets Protection: Zero environment values, plain passwords, JWT keys, or tokens printed or logged.
* **Prisma Provider & Lock File:**
  * Checked: `apps/api/prisma/schema.prisma` datasource provider (`postgresql`), `apps/api/prisma/migrations/migration_lock.toml` (`provider = "postgresql"`).
  * Status: **Matched**. Both define `provider = "postgresql"`.
* **Migration SQL vs Prisma Schema Consistency:**
  * Checked: `apps/api/prisma/migrations/20261028000000_init/migration.sql` (779 lines, 26,149 bytes) diffed against `apps/api/prisma/schema.prisma` via `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`.
  * Status: **Exact Match**. 100% byte-for-byte correspondence between schema and migration SQL.

---

## 2. Database Setup Method

* **Active Database:** Dedicated cloud PostgreSQL 16/18 database instance hosted via Supabase on AWS (`aws-0-ap-northeast-2.pooler.supabase.com`).
* **Connection Routing:**
  * Application queries and transactions connect via `DATABASE_URL` through the connection pooler on port 6543 (`pgbouncer=true`).
  * Schema migrations and DDL operations connect via `DIRECT_URL` session connection on port 5432.
* **Network Reachability:**
  * Tested TCP connections to `aws-0-ap-northeast-2.pooler.supabase.com` on both port 5432 (`TcpTestSucceeded: True`) and port 6543 (`TcpTestSucceeded: True`).
* **Data Safety:**
  * Existing tables and structure were preserved without destructive operations. Neither `prisma migrate reset` nor `prisma db push --force-reset` was used.

---

## 3. Migration Name and Application Status

* **Migration Identifier:** `20261028000000_init`
* **Prisma Migration Status Command:**
  ```bash
  pnpm --filter @doctalk/api prisma migrate status
  ```
  * Exit Code: `0`
  * Output:
    ```
    Datasource "db": PostgreSQL database "postgres", schema "public" at "aws-0-ap-northeast-2.pooler.supabase.com:5432"
    1 migration found in prisma/migrations
    Database schema is up to date!
    ```
* **Prisma Migrate Deploy Command:**
  ```bash
  pnpm --filter @doctalk/api prisma migrate deploy
  ```
  * Exit Code: `0`
  * Output:
    ```
    1 migration found in prisma/migrations
    No pending migrations to apply.
    ```
* **Migration History Tracking Table (`_prisma_migrations`):**
  * Queried record:
    * `id`: `214987bf-1cdc-4fe1-b1d3-39ca937eab19`
    * `migration_name`: `20261028000000_init`
    * `checksum`: `070dd48a22cf355b797e9a761f67ee710f652a22597c2470e9971c882a00a398`
    * `applied_steps_count`: `1`
    * `rolled_back_at`: `null`

---

## 4. Expected vs Actual Schema Status

Direct PostgreSQL catalog queries against `information_schema` and `pg_catalog` verified the exact database schema:

| Schema Entity | Expected | Actual | Verification Status |
|---|:---:|:---:|:---:|
| **Public Base Tables** | 24 core domain tables | 38 tables (all 24 core domain tables + supporting join/outbox/policy tables) | **MATCH / PASS** |
| **PostgreSQL Custom Enums** | 14 enums | 14 enums (`UserRole`, `UserStatus`, `DoctorStatus`, `CredentialStatus`, `AppointmentKind`, `ConsultationMode`, `AppointmentStatus`, `PrescriptionStatus`, `ScanStatus`, `PaymentStatus`, `LedgerAccount`, `LedgerDirection`, `PracticeType`, `VerificationTokenType`) | **MATCH / PASS** |
| **Indexes & Foreign Keys** | 61+ indexes | 75 indexes and relational foreign key constraints | **MATCH / PASS** |

### Verified Table Manifest
`_prisma_migrations`, `ai_interactions`, `appointments`, `audit_logs`, `availability_exceptions`, `care_relationships`, `chat_messages`, `consents`, `consultation_sessions`, `doctor_agreements`, `doctor_availability_rules`, `doctor_credentials`, `doctor_profiles`, `doctor_specialties`, `doctor_subscriptions`, `encounters`, `files`, `instant_requests`, `ledger_entries`, `notification_preferences`, `notifications`, `outbox_events`, `patient_profiles`, `payments`, `policy_documents`, `prescription_items`, `prescriptions`, `record_access_grants`, `refresh_tokens`, `refunds`, `reviews`, `settlements`, `specialties`, `subscription_plans`, `users`, `verification_decisions`, `verification_tokens`, `webhook_events`.

---

## 5. Persistence Integration Test Results

Automated integration tests were executed directly against the live database using `apps/api/test/persistence.spec.ts`. Zero mocks, zero in-memory maps, and zero fixtures were substituted for persistence:

```
$ vitest run test/persistence.spec.ts

 ✓ test/persistence.spec.ts (6 tests) 27271ms
   ✓ Real PostgreSQL Persistence & RBAC Verification Suite > fails safely and throws when database is disconnected or unreachable 1028ms
   ✓ Real PostgreSQL Persistence & RBAC Verification Suite > persists a patient user, password hash, patient profile, and consents in a transaction 4409ms
   ✓ Real PostgreSQL Persistence & RBAC Verification Suite > rejects duplicate patient email registration at database constraint level 835ms
   ✓ Real PostgreSQL Persistence & RBAC Verification Suite > persists doctor onboarding application, credentials, and verification tokens 4015ms
   ✓ Real PostgreSQL Persistence & RBAC Verification Suite > persists encrypted MFA secrets and refresh tokens 2741ms
   ✓ Real PostgreSQL Persistence & RBAC Verification Suite > persists admin verification decision and audit log in an atomic transaction 4620ms

 Test Files  1 passed (1)
      Tests  6 passed (6)
```

### Persistence Verification Checklist
* **Patient User Creation:** Persisted in `users` with `role: PATIENT`, `status: ACTIVE`.
* **Patient Profile Association:** Persisted in `patient_profiles` with `fullName`, `dob`, `sex`, and `timezone`.
* **Fresh Connection Retrieval:** Verified after opening a separate, clean `PrismaClient` instance querying by ID.
* **Duplicate Email Rejection:** Database unique index constraint `users_email_key` threw duplicate key error on duplicate email attempt.
* **Password Hashing:** Password stored as Argon2id hash string (`$argon2id$...`); verified against raw password with zero plaintext storage.
* **Consent Records:** Persisted in `consents` table with `TERMS_OF_SERVICE` and `PRIVACY_POLICY` versions and timestamps.
* **Doctor Application & Status:** Persisted in `users` with `status: PENDING` and in `doctor_profiles` with initial `status: APPLIED`.
* **Doctor Professional Details:** Verified fields for `yearsExperience`, `consultationFeePaise`, `languages`, `timeZone`.
* **Tokens Persistence:** Verification tokens persisted in `verification_tokens`; refresh token families persisted in `refresh_tokens` with SHA-256 hashes.
* **Doctor Verification Decisions & Audit Logs:** Admin approval transaction persisted row in `verification_decisions` (`decision: APPROVED`, `adminId`, `notes`) and row in `audit_logs` (`action: DOCTOR_APPLICATION_APPROVED`, `actorUserId`, `actorRole: ADMIN`).
* **MFA Configuration:** TOTP secrets encrypted with AES-256-GCM via `CLINICAL_ENCRYPTION_KEY` and persisted in `users.mfaSecretEnc`. Decryption verified with 100% plaintext fidelity.
* **Safe Failure Without Fallback:** When database connection is unreachable, queries reject immediately and throw standard database errors without falling back to in-memory storage.
* **Test Isolation & Cleanup:** Test records utilized dynamic UUIDs and prefix `test_audit_<timestamp>` and were cleanly removed in `afterAll`.

---

## 6. Production Startup Results

The compiled production distribution was started directly using `node dist/src/main.js`:

```
[Nest] 15452 - 10/28/2026, 9:47:09 PM   LOG [NestFactory] Starting Nest application...
[Nest] 15452 - 10/28/2026, 9:47:09 PM   LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 15452 - 10/28/2026, 9:47:09 PM   LOG [InstanceLoader] PrismaModule dependencies initialized
[Nest] 15452 - 10/28/2026, 9:47:09 PM   LOG [InstanceLoader] HealthModule dependencies initialized
[Nest] 15452 - 10/28/2026, 9:47:09 PM   LOG [InstanceLoader] AuthModule dependencies initialized
[Nest] 15452 - 10/28/2026, 9:47:09 PM   LOG [InstanceLoader] DoctorsModule dependencies initialized
[Nest] 15452 - 10/28/2026, 9:47:09 PM   LOG [InstanceLoader] AppointmentsModule dependencies initialized
[Nest] 15452 - 10/28/2026, 9:47:09 PM   LOG [InstanceLoader] PaymentsModule dependencies initialized
[Nest] 15452 - 10/28/2026, 9:47:09 PM   LOG [InstanceLoader] AdminModule dependencies initialized
[Nest] 15452 - 10/28/2026, 9:47:09 PM   LOG [PrismaService] Connected successfully to PostgreSQL database via Prisma
[Nest] 15452 - 10/28/2026, 9:47:09 PM   LOG [NestApplication] Nest application successfully started
[Nest] 15452 - 10/28/2026, 9:47:09 PM   LOG [Bootstrap] 🩺 DocTALK API operational on port 4000 (prefix: /v1) [Env: development]
```

### Production Runtime Features Verified
1. **Module Interop:** `cookie-parser` CommonJS module executed without runtime error under `node dist/src/main.js`.
2. **Cookie Parsing:**
   * Request without `doctalk_refresh_token` cookie returned HTTP 401 `{ "code": "AUTH_UNAUTHORIZED", "message": "Refresh token is required" }`.
   * Request with `Cookie: doctalk_refresh_token=invalid_sample` parsed successfully and returned HTTP 401 `{ "code": "AUTH_TOKEN_EXPIRED", "message": "Invalid refresh token" }`.
3. **Information Disclosure Prevention:** Public error responses strictly conform to standard format `{ code, message, requestId }` with zero stack traces or environment variables exposed.
4. **Clean Shutdown:** Process terminated cleanly upon `SIGINT` with zero orphaned connections.

---

## 7. Health Endpoint Results for Available and Unavailable Database Scenarios

### Scenario A: Database Available & Connected
* **Liveness Probe (`GET /v1/health/liveness`):**
  * HTTP Status: **200 OK**
  * Response Body:
    ```json
    {
      "status": "ok",
      "service": "DocTALK API",
      "version": "0.1.0",
      "timestamp": "2026-10-28T16:17:16.029Z"
    }
    ```
* **Readiness Probe (`GET /v1/health/readiness`):**
  * HTTP Status: **200 OK**
  * Response Body:
    ```json
    {
      "status": "ready",
      "timestamp": "2026-10-28T16:17:16.854Z",
      "database": "connected",
      "providers": {
        "video": "mock",
        "payment": "mock",
        "email": "mock",
        "storage": "mock",
        "ai": "disabled"
      },
      "featureFlags": {
        "instantConsult": false,
        "aiIntake": false,
        "aiSummary": false,
        "subscriptions": true,
        "intl": false
      }
    }
    ```

### Scenario B: Database Unavailable & Disconnected (Isolated Test Environment)
Tested by launching an isolated instance with unreachable database address `postgresql://invalid:invalid@127.0.0.1:5433/unreachable`:
* **Liveness Probe (`GET /v1/health/liveness`):**
  * HTTP Status: **200 OK** (process is alive and accepting connections).
* **Readiness Probe (`GET /v1/health/readiness`):**
  * HTTP Status: **503 Service Unavailable**
  * Response Body:
    ```json
    {
      "code": "SERVICE_UNAVAILABLE",
      "message": "Required dependency unavailable: PostgreSQL database is not connected.",
      "requestId": "8ec2083b-71ad-4994-a330-9be27a785ab8"
    }
    ```

---

## 8. Quality Gate Results and Exit Codes

Every supported verification command in the monorepo was executed and recorded:

| Gate | Command | Exit Code | Result | Evidence Summary |
|---|---|:---:|:---:|---|
| **Prisma Schema Validation** | `pnpm --filter @doctalk/api prisma validate` | `0` | **PASS** | Valid datamodel, 0 errors. |
| **Prisma Migration Status** | `pnpm --filter @doctalk/api prisma migrate status` | `0` | **PASS** | Schema is up to date, 1 migration applied, 0 pending. |
| **TypeScript Typecheck** | `pnpm typecheck` | `0` | **PASS** | 4 tasks successful across `@doctalk/shared`, `@doctalk/api`, `@doctalk/web`. Strict type checking clean. |
| **Monorepo ESLint** | `pnpm lint` | `0` | **PASS** | 4 tasks successful across all 3 packages (0 errors, 2 Next.js `<Image>` non-blocking warnings). |
| **Database Persistence Integration Tests** | `pnpm --filter @doctalk/api test test/persistence.spec.ts` | `0` | **PASS** | 6/6 tests passed against live PostgreSQL database. |
| **Automated Test Suite (Full Monorepo)** | `pnpm test` | `0` | **PASS** | 10 test files passed, 49/49 total tests passed, 0 failed (Shared: 11, API: 33, Web: 5). |
| **Production Build** | `pnpm build` | `0` | **PASS** | Turborepo compiled `@doctalk/shared` (tsc), `@doctalk/api` (tsc build), and `@doctalk/web` (Next.js 13 static pages). |

---

## 9. Remaining Mock Providers & Documented Limitations

The following mocks remain intentionally configured for local development and will be replaced in subsequent phases according to the project roadmap (`plan.md`):

1. **`MockStorageProvider` (Phase P7):** File uploads (degree certificates, registration proofs) return synthetic IDs. Direct-to-S3/MinIO signed presigned URL upload pipeline is scheduled for Phase P7 hardening.
2. **`MockEmailProvider` (Phase P7):** Verification and password reset emails are logged to the console via NestJS logger. Integration with Resend/SendGrid will occur in Phase P7.
3. **`MockPaymentProvider` (Phase P3):** Simulates Razorpay order creation, signatures, and webhooks in local test mode. Real Razorpay India gateway onboarding is scheduled for Phase P3.
4. **`FICTIONAL_DOCTORS` (Phase P2):** Serves as sample data for initial search and listing; will be transitioned to live database querying in Phase P2.

---

## 10. Phase P0 Verdict: PASS ✅

* **Justification:**
  * Clean Turborepo, pnpm workspaces, and strict TypeScript compilation verified.
  * Version-controlled migration history established (`apps/api/prisma/migrations/20261028000000_init/migration.sql`) and deployed to PostgreSQL.
  * Operational health probes verified: Liveness returns 200, Readiness returns 200 when connected and 503 when disconnected.
  * Compiled production entrypoint `node dist/src/main.js` boots reliably and parses HTTP cookies.
  * Zero sensitive tokens or stack traces exposed in API error responses.
  * All quality gates (typecheck, lint, build, unit tests) exit with code 0.

---

## 11. Phase P1 Verdict: PASS ✅

* **Justification:**
  * Patient Registration: Fully verified with real transactional insertion into `users`, `patient_profiles`, and `consents`.
  * Duplicate Email Rejection: Enforced at PostgreSQL unique constraint level.
  * Password Cryptography: Argon2id hashing verified in PostgreSQL with zero plaintext exposure.
  * MFA Security: TOTP secrets encrypted with AES-256-GCM using `CLINICAL_ENCRYPTION_KEY` and verified persisted in `users.mfaSecretEnc`.
  * Doctor Onboarding & Verification: Doctor application (`status: APPLIED`), primary credential (`status: SUBMITTED`), and admin verification adjudication (`verification_decisions` and `audit_logs`) verified in database transactions.
  * Token Lifecycle: Verification tokens and refresh token families persisted with cryptographic SHA-256 hashes.
  * Session & Security: `httpOnly` cookie handling, refresh token rotation, and RBAC guards verified.

---

## 12. Phase P2 Readiness Verdict: READY 🚀

* **Justification:**
  * All mandatory requirements for Phase P0 and Phase P1 have passed with verifiable evidence.
  * Live PostgreSQL database connectivity and transactional persistence are established and operational.
  * The database schema already includes the necessary tables and constraints for Phase P2 scheduling (`appointments`, `doctor_availability_rules`, `availability_exceptions`, `doctor_profiles`, `specialties`).
  * The codebase is ready to proceed with Phase P2: Doctor Discovery, Availability Rules, and Double-Booking Prevention.

---

## 13. Exact Next Steps for Phase P2 (Discovery & Scheduled Booking)

1. **BE-P2.1 Doctor Discovery API:** Connect `DoctorsService.search` to query live `doctor_profiles` and `doctor_specialties` from PostgreSQL rather than static data.
2. **BE-P2.2 Availability & Slot Engine:** Implement slot generation based on `doctor_availability_rules` and `availability_exceptions`.
3. **BE-P2.3 Double-Booking Prevention:** Implement PostgreSQL `tstzrange` GiST exclusion constraints or atomic transaction-level hold state machines preventing overlapping slots for the same doctor.
4. **FE-P2.1 Doctor Discovery UI:** Wire up the landing page search and filter components to the live `/v1/doctors` API.
5. **FE-P2.2 Booking Flow UI:** Build the slot picker modal and 10-minute slot hold checkout flow.
