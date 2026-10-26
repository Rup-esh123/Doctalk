# DocTALK — Architecture

> Status: design baseline v0.1 (planning stage, no code yet)
> Sources: the product-planning chat (Stages 1–5). Items marked **OPEN** were never confirmed by the product owner; they carry my recommended default.
> Not legal advice. Indian telemedicine, professional-registration, data-protection and payment rules must be reviewed by a healthcare-law professional before real patients are accepted.

---

## 0. Product summary

DocTALK is a hybrid telemedicine marketplace for India first, international later. Patients find verified doctors, book or instantly request consultations, pay upfront, consult by video, audio or secure chat, and receive prescriptions and follow-up care. Independent doctors and a DocTALK-managed clinic network both operate on the platform.

### 0.1 Confirmed decisions (from chat)

| Area | Decision |
|---|---|
| Platform | Web app, responsive, mobile-ready (PWA) |
| Market | India first, international later |
| Consultation modes | Video + audio + secure text chat |
| Quality bar | Production-ready (security, RBAC, tests, backups, verified doctors) |
| Budget | Student / low-cost |
| Business model | Hybrid: marketplace + managed clinic |
| Doctor onboarding | Open applications + invitations; both require verification |
| Revenue | Tiered commission + doctor subscriptions (live at launch) |
| AI | Assistive only, doctor-reviewed, no diagnosis/prescribing |
| Booking | Scheduled + instant (scheduled ships first) |
| Pricing | Independent doctors set fees; managed clinic pricing set by DocTALK |
| Medical records | Clinic-managed under defined access/retention policy |
| Languages | English at launch; i18n-ready for Hindi/Bengali |
| Payment timing | Prepay before confirmation |
| Commission | Tiered (independent vs managed) |
| Cancellation | Policy-based (who cancels, how early) |
| Subscriptions | At launch: Free and Premium doctor plans |

### 0.2 Open decisions (Stage 5, unanswered)

| # | Question | Provisional default (my recommendation) |
|---|---|---|
| O-1 | Doctor verification depth | Manual admin approval + automated expiry reminders |
| O-2 | Emergency handling | Conservative emergency guidance, direct to emergency services, no automated diagnosis; no AI-only triage |
| O-3 | AI scope at launch | Admin help + structured intake for doctor; summaries drafted only with explicit clinician approval (can be switched off by flag) |
| O-4 | Clinical-record access | Restricted to explicitly authorized clinicians per care relationship, plus patient access |

Also still undefined: exact commission percentages (₹500 example used 15% independent / 25% managed — illustrative only), refund-window numbers, subscription price, doctor payout mechanism (see 9.4).

### 0.3 Non-goals for v1

International live consultations, native mobile apps, AI diagnosis or prescribing, consultation recording by default, pharmacy/lab integrations, microservices.

---

## 1. System context

```
 Patient web/PWA   Doctor web/PWA   Admin web
        \               |              /
         \              |             /
          +----- HTTPS (TLS) ---------+
                        |
              Edge / CDN / WAF (Cloudflare free)
                        |
          +-------------+--------------+
          |                            |
   Next.js (web)                 NestJS API (modular monolith)
   SSR + static                  REST + WebSocket gateway
                                        |
     +------------+----------+----------+-----------+-------------+
     |            |          |          |           |             |
 PostgreSQL     Redis    Object storage  Video    Payment      Email/SMS
 (primary)   (cache,jobs, (private,      provider  gateway      provider
              presence)   signed URLs)   (WebRTC)  (Razorpay)
                                        |
                              BullMQ workers (same codebase,
                              separate process)
```

Principle: build a **modular monolith**. One backend codebase, strict module boundaries, one database. Split only when load or team size forces it.

---

## 2. Tech stack

| Layer | Choice | Why (see decisions.md) | Low-cost notes |
|---|---|---|---|
| Frontend | Next.js (App Router), React, TypeScript | SSR for SEO on doctor pages, one language | Vercel free tier or self-host |
| UI | Tailwind CSS, shadcn/ui | Accessible components, fast | Free |
| i18n | `next-intl` from day one | English now, Hindi/Bengali later with no rewrite | Free |
| PWA | `serwist` / next-pwa, web manifest | Mobile-ready without app stores | Free |
| Forms/validation | React Hook Form + Zod (shared schemas) | One validation source across FE/BE | Free |
| Data fetching | TanStack Query + generated typed API client | Caching, retries | Free |
| Backend | NestJS (TypeScript), REST + Socket.IO gateway | Modules, guards, DI, testable | Render/Railway/Fly small instance |
| ORM | Prisma | Migrations, type safety | Free |
| Database | PostgreSQL 16 | Transactions, range constraints, JSONB | Managed free/low tier (Neon/Supabase) — choose an India-region option if available; verify |
| Cache/queue | Redis + BullMQ | Reminders, webhooks retry, presence | Upstash free tier or small Redis |
| Auth | Own JWT + rotating refresh in NestJS, Argon2id, TOTP MFA | Separate API needs one auth authority | Free |
| Video/audio | `VideoProvider` interface; adapter for LiveKit or 100ms (final pick via P4 spike) | Never build WebRTC infra | Check free minutes and data region before choosing |
| Chat | Socket.IO in NestJS, messages persisted in Postgres | Cheapest, full access control | Free |
| Files | S3-compatible private bucket (Cloudflare R2 / Supabase Storage / AWS S3 Mumbai) | Signed, short-lived URLs only | Verify egress pricing |
| Payments | Razorpay (Orders, Checkout, Webhooks; Route for marketplace splits) | India-first | Per-transaction fees only |
| Email | Resend or Brevo | Transactional email first | Free tier |
| SMS/WhatsApp | Deferred | Add when justified | Pay-per-message |
| AI | Provider-agnostic `AiProvider` interface, low-cost model, no identifiable data without privacy review | Assistive only | Hard monthly cap |
| Observability | Sentry, pino JSON logs, uptime monitor, OpenTelemetry later | Errors/perf | Free tiers |
| CI/CD | GitHub Actions | Lint, test, build, migrate, deploy | Free for small use |
| Containers | Docker, docker-compose for local | Reproducible | Free |
| Monorepo | pnpm workspaces + Turborepo | Share types/schemas | Free |
| Testing | Vitest/Jest, Supertest, Playwright, Testcontainers | See test-checklists.md | Free |

> Free tiers are not production-free. Video minutes, DB size, backups, storage egress, SMS and AI calls all cost money at scale. Track in the cost register (section 16).

---

## 3. Monorepo folder structure

```
doctalk/
├─ apps/
│  ├─ web/                          # Next.js
│  │  ├─ src/
│  │  │  ├─ app/
│  │  │  │  ├─ (public)/            # landing, doctor search, doctor profile, legal pages
│  │  │  │  ├─ (auth)/              # login, register, verify-email, mfa
│  │  │  │  ├─ (patient)/           # dashboard, appointments, records, prescriptions, payments
│  │  │  │  ├─ (doctor)/            # dashboard, schedule, patients, earnings, subscription, onboarding
│  │  │  │  ├─ (admin)/             # verification queue, users, payments, refunds, audit, config
│  │  │  │  ├─ consult/[appointmentId]/   # waiting room + live room (video/audio/chat)
│  │  │  │  ├─ api/                 # only BFF helpers if needed (no business logic)
│  │  │  │  └─ layout.tsx, error.tsx, not-found.tsx
│  │  │  ├─ components/
│  │  │  │  ├─ ui/                  # shadcn primitives
│  │  │  │  ├─ doctor/              # DoctorCard, SlotPicker, FeeBreakdown
│  │  │  │  ├─ consult/             # VideoTile, ControlsBar, ChatPanel, DeviceCheck, WaitingRoom
│  │  │  │  ├─ records/ prescriptions/ payments/ admin/
│  │  │  │  └─ safety/              # EmergencyBanner, ConsentDialog
│  │  │  ├─ lib/                    # api-client.ts, auth.ts, socket.ts, tz.ts, money.ts, flags.ts
│  │  │  ├─ hooks/                  # useSession, useSlots, useConsultRoom, usePresence
│  │  │  ├─ i18n/                   # config.ts, messages/en.json (hi.json, bn.json later)
│  │  │  ├─ styles/
│  │  │  └─ middleware.ts           # route guards by role (UX only; real auth is server-side)
│  │  ├─ public/ (manifest.webmanifest, icons)
│  │  └─ tests/ (playwright)
│  │
│  └─ api/                          # NestJS
│     ├─ src/
│     │  ├─ main.ts, app.module.ts, worker.ts      # worker.ts = BullMQ processors entry
│     │  ├─ config/                 # env schema (zod), feature flags
│     │  ├─ common/
│     │  │  ├─ guards/ (jwt.guard, roles.guard, policy.guard, throttler)
│     │  │  ├─ decorators/ (@CurrentUser, @Roles, @Audit)
│     │  │  ├─ interceptors/ (audit.interceptor, logging, timeout)
│     │  │  ├─ filters/ (http-exception.filter)
│     │  │  ├─ pipes/ (zod-validation.pipe)
│     │  │  └─ utils/ (money, time, idempotency, crypto)
│     │  ├─ modules/
│     │  │  ├─ auth/               # register, login, refresh, mfa, password reset
│     │  │  ├─ users/
│     │  │  ├─ patients/
│     │  │  ├─ doctors/            # profiles, specialties, languages, search
│     │  │  ├─ credentials/        # upload, verify, expiry reminders
│     │  │  ├─ agreements/         # versioned commission/terms per doctor
│     │  │  ├─ availability/       # weekly rules, exceptions, slot generation
│     │  │  ├─ appointments/       # booking, hold, cancel, reschedule, state machine
│     │  │  ├─ instant/            # instant requests, queue, matching, presence
│     │  │  ├─ consultations/      # session lifecycle, provider tokens, no-show
│     │  │  ├─ chat/               # gateway + persistence
│     │  │  ├─ records/            # encounters, notes, care relationships, access grants
│     │  │  ├─ prescriptions/
│     │  │  ├─ files/              # signed upload/download, scan status
│     │  │  ├─ payments/           # orders, webhooks, reconciliation
│     │  │  ├─ ledger/             # entries, commission calc, settlement reports
│     │  │  ├─ refunds/
│     │  │  ├─ subscriptions/      # plans, entitlements
│     │  │  ├─ reviews/
│     │  │  ├─ notifications/      # email templates, scheduler
│     │  │  ├─ ai/                 # intake assistant, summary drafts (flagged)
│     │  │  ├─ admin/              # verification queue, disputes, config
│     │  │  ├─ audit/
│     │  │  ├─ policies/           # cancellation/refund rules, versioned
│     │  │  └─ health/             # liveness, readiness
│     │  ├─ providers/             # video/, payment/, email/, storage/, ai/  (adapters)
│     │  └─ jobs/                  # reminders, hold-expiry, expiry-checks, webhook-retry, reconcile
│     ├─ prisma/ (schema.prisma, migrations/, seed.ts, sql/ (btree_gist, triggers))
│     └─ test/ (unit, integration, e2e)
│
├─ packages/
│  ├─ shared/                       # zod schemas, enums, DTO types, error codes, state-machine tables
│  ├─ config/                       # eslint, tsconfig, prettier
│  └─ ui-tokens/                    # optional design tokens
├─ infra/
│  ├─ docker/ (Dockerfile.web, Dockerfile.api, docker-compose.yml)
│  ├─ ci/ (GitHub Actions)
│  └─ scripts/ (backup, restore-test, rotate-keys)
├─ docs/ (these files)
├─ .env.example
├─ turbo.json, pnpm-workspace.yaml
└─ README.md
```

---

## 4. Frontend architecture

### 4.1 Portals and routes

| Portal | Routes (examples) | Guard |
|---|---|---|
| Public | `/`, `/doctors`, `/doctors/[slug]`, `/how-it-works`, `/legal/*`, `/emergency` | none |
| Auth | `/login`, `/register/patient`, `/register/doctor`, `/verify`, `/mfa` | guest-only |
| Patient | `/app`, `/app/appointments`, `/app/appointments/[id]`, `/app/records`, `/app/prescriptions`, `/app/payments`, `/app/settings` | role PATIENT |
| Doctor | `/doctor`, `/doctor/onboarding`, `/doctor/schedule`, `/doctor/appointments`, `/doctor/patients/[id]`, `/doctor/earnings`, `/doctor/plan`, `/doctor/instant` | role DOCTOR (+ verified for patient-facing pages) |
| Consult | `/consult/[appointmentId]` | participant of that appointment |
| Admin | `/admin/verification`, `/admin/users`, `/admin/payments`, `/admin/refunds`, `/admin/audit`, `/admin/config` | ADMIN/SUPPORT |

Next.js `middleware.ts` only redirects for UX. **Every authorization decision is repeated on the API.**

### 4.2 Key screens

- **Search:** filters (specialty, language, fee range, availability, online-now, rating). Distance and country filters are Phase 3 (international).
- **Doctor profile:** verified badge, qualifications, languages, fee, next slots, reviews.
- **Booking:** slot picker (shows slots in patient's time zone), fee breakdown (doctor fee + any platform charge), cancellation policy displayed before payment, consent checkbox, Razorpay Checkout.
- **Instant request:** specialty → request → "searching" state → accepted / queue / fallback to scheduling.
- **Waiting room:** device check (camera/mic), connection test, status ("Doctor will join soon"), emergency link, chat.
- **Live room:** video/audio tiles, mute/camera/leave, chat panel, reconnect handling, end-state screen.
- **Records and prescriptions:** read-only for patients, PDF download via signed URL.
- **Doctor onboarding wizard:** profile → credentials upload → agreement acceptance → pending verification state.
- **Admin queues:** verification, refund exceptions, disputes, audit search.

### 4.3 State, data and real-time

- Server state via TanStack Query; no medical data in `localStorage`.
- Socket.IO client wrapper (`lib/socket.ts`) with token refresh and reconnect.
- Presence heartbeat for doctors who enabled "instant".
- Optimistic UI only for chat; never for payments or booking confirmation.

### 4.4 Cross-cutting frontend rules

- **Money:** integer paise from API, formatted by `lib/money.ts`.
- **Time:** API returns UTC ISO strings and the doctor's IANA time zone. Render with `lib/tz.ts`; never compute slots on the client.
- **i18n:** no hard-coded strings; keys in `messages/en.json`; locale-aware dates/currency.
- **Accessibility:** WCAG 2.1 AA target, keyboard navigation, captions-ready layouts.
- **Safety UI:** persistent emergency banner on booking/instant flows; consent dialogs versioned.
- **Security:** CSP, no secrets in bundle, tokens in httpOnly cookies, `rel=noopener`, sanitize rendered text.
- **PWA:** installable, offline shell only; never cache PHI responses in service worker.

---

## 5. Backend architecture

### 5.1 Module responsibilities

| Module | Owns | Key rules |
|---|---|---|
| auth | Registration, login, refresh rotation, MFA, reset | Argon2id; lockout + rate limits; MFA mandatory for doctors/admin |
| doctors/credentials | Profiles, search, license records | Not searchable/bookable until `VERIFIED` and agreement accepted |
| agreements | Versioned commission + terms | Commission snapshot copied onto each appointment |
| availability | Weekly rules, exceptions, slot generation | Slots computed on server in doctor's TZ, stored/compared in UTC |
| appointments | Booking, hold, cancel, reschedule | State machine (5.3); DB-level no-overlap guarantee |
| instant | Requests, queue, doctor matching | Only doctors who are online, verified, entitled, and not in session |
| consultations | Session lifecycle, provider room/tokens | Token only issued in join window, to participants |
| chat | Realtime gateway + history | Only appointment participants; persisted; attachments via files module |
| records | Encounters, notes, access | Access via care relationship; every read audited |
| prescriptions | Draft, sign, issue, PDF | Doctor-only; immutable after issue (amend = new version) |
| payments | Orders, webhook intake, status | Webhook is source of truth; idempotent |
| ledger | Append-only financial events | Commission computed server-side; reconcilable |
| refunds | Policy evaluation, gateway refunds | Idempotent; admin override audited |
| subscriptions | Plans, entitlements | DB-managed; gateway only collects |
| reviews | Post-visit ratings | Only completed, paid, own appointments |
| notifications | Email (SMS later), templates, scheduler | No clinical content in emails |
| ai | Intake and summary drafting | Flagged, minimal data, human approval, logged |
| admin | Queues, disputes, config | Every action audited |
| audit | Append-only action log | No PHI or secrets in log payloads |

### 5.2 API conventions

- REST, versioned `/v1`, JSON, zod-validated DTOs from `packages/shared`.
- Errors: `{ code, message, details?, requestId }`; codes defined in shared.
- Pagination: cursor-based. Sorting/filters whitelisted.
- Idempotency: `Idempotency-Key` header on booking, payment-order, refund endpoints.
- Rate limits: strict on auth, OTP, search-scraping, booking.
- Authorization layers: JWT guard → role guard → policy guard (resource-level, e.g. "is participant", "has care relationship").

### 5.3 State machines

**Appointment**
```
 HELD ──(payment captured webhook)──▶ CONFIRMED ──(join window opens)──▶ READY
  │                                       │                               │
  │ (hold expires / payment failed)       │ (cancel by patient/doctor)    │ (both join)
  ▼                                       ▼                               ▼
 EXPIRED                              CANCELLED_*                    IN_PROGRESS ──▶ COMPLETED
                                                                          │
                                      NO_SHOW_PATIENT / NO_SHOW_DOCTOR ◀──┘ (no join by grace limit)
                                      REFUNDED / PARTIALLY_REFUNDED (payment-side status, not appointment status)
```
Valid transitions live in `packages/shared/state/appointment.ts` and are enforced in the service and tested exhaustively.

**Instant request:** `REQUESTED → OFFERED → ACCEPTED → PAYMENT_PENDING → CONFIRMED` (then follows appointment) or `→ QUEUED → EXPIRED / CANCELLED`.

**Doctor credential:** `SUBMITTED → UNDER_REVIEW → VERIFIED | REJECTED | NEEDS_INFO`; `VERIFIED → EXPIRING → EXPIRED | SUSPENDED`.

### 5.4 Cancellation and refund policy (placeholder numbers — product owner must confirm)

| Who cancels | When | Default refund |
|---|---|---|
| Patient | ≥ 24h before | 100% (less gateway fee, TBD) |
| Patient | 2–24h before | 50% |
| Patient | < 2h or no-show | 0% |
| Doctor | any time | 100% + rebooking help |
| Doctor no-show | — | 100% + flagged on doctor record |
| Technical failure (platform) | — | 100% or free reschedule |
| Consultation started | — | Admin review only |

Rules live in the `policies` module with a version; each appointment stores `cancel_policy_version`.

### 5.5 Background jobs (BullMQ)

| Job | Trigger | Purpose |
|---|---|---|
| `hold-expiry` | delayed job at hold creation | Release unpaid slot holds |
| `reminders` | scheduled T-24h, T-1h, T-10m | Email reminders |
| `webhook-retry` | failed webhook processing | Reprocess safely |
| `payment-reconcile` | nightly | Compare gateway vs DB |
| `credential-expiry` | daily | 60/30/7-day warnings; suspend on expiry |
| `no-show-sweeper` | every minute near start times | Mark no-shows, trigger refund rules |
| `instant-expiry` | delayed | Expire unanswered requests |
| `outbox-dispatch` | continuous | Publish domain events reliably |
| `retention-review` | monthly | Flag records eligible for lawful review (no auto delete) |

### 5.6 Provider adapters

```
VideoProvider  { createRoom(apptId), issueToken(room, userId, role, ttl), endRoom(room), parseWebhook(req) }
PaymentProvider{ createOrder(), verifyWebhook(), refund(), createTransfer() }
EmailProvider  { send(template, to, vars) }
StorageProvider{ signedPut(key, mime, size), signedGet(key, ttl), delete(key) }
AiProvider     { complete(prompt, opts) }   // behind redaction + flag + budget cap
```
Swapping a vendor means writing one adapter; no business logic changes.

---

## 6. Database architecture

### 6.1 Conventions

- PostgreSQL 16, UUID primary keys, `timestamptz` stored in UTC.
- Money as **integer paise** + ISO currency code. No floats.
- Soft-delete only where lawful; clinical records are never hard-deleted by users.
- Enums via Postgres enums or check constraints, mirrored in `packages/shared`.
- Required extensions: `pgcrypto`, `btree_gist`, `citext`, `pg_trgm`.
- Application-level encryption for the most sensitive fields (e.g., clinical note bodies, registration documents metadata) with a key stored outside the DB; managed-DB encryption at rest plus TLS in transit.

### 6.2 Tables

**Identity and consent**

| Table | Key columns |
|---|---|
| `users` | id, email (citext, unique), phone, password_hash, role, status, email_verified_at, mfa_secret_enc, mfa_enabled, last_login_at |
| `refresh_tokens` | id, user_id, token_hash, family_id, expires_at, revoked_at, ip, user_agent |
| `consents` | id, user_id, type, policy_version, accepted_at, ip |
| `policy_documents` | id, type, version, body_url, effective_from |

**Profiles and doctors**

| Table | Key columns |
|---|---|
| `patient_profiles` | user_id (PK/FK), full_name, dob, sex, timezone, emergency_contact_enc, preferred_language |
| `doctor_profiles` | user_id (PK/FK), slug (unique), display_name, bio, practice_type (INDEPENDENT/MANAGED), years_experience, consultation_fee_paise, currency, languages[], accepts_instant, status, country, time_zone, rating_avg, rating_count |
| `specialties` | id, name, slug |
| `doctor_specialties` | doctor_id, specialty_id, is_primary |
| `doctor_credentials` | id, doctor_id, type, council_name, registration_number, document_file_id, status, verified_by, verified_at, expires_at, notes |
| `doctor_agreements` | id, doctor_id, version, commission_bps (basis points), terms_policy_id, effective_from, effective_to, accepted_at |
| `doctor_availability_rules` | id, doctor_id, weekday, start_time, end_time, slot_minutes, buffer_minutes, mode_flags |
| `availability_exceptions` | id, doctor_id, date range (tstzrange), kind (BLOCK/EXTRA), reason |

**Scheduling and consultation**

| Table | Key columns |
|---|---|
| `appointments` | id, patient_id, doctor_id, kind (SCHEDULED/INSTANT), mode (VIDEO/AUDIO/CHAT), period (tstzrange), status, fee_paise, platform_fee_paise, commission_bps_snapshot, agreement_id, cancel_policy_version, hold_expires_at, cancelled_by, cancel_reason, created_at |
| `instant_requests` | id, patient_id, specialty_id, status, offered_to[], accepted_by, appointment_id, expires_at |
| `consultation_sessions` | id, appointment_id (unique), provider, room_id, status, patient_joined_at, doctor_joined_at, started_at, ended_at, end_reason |
| `chat_messages` | id, appointment_id, sender_id, body_enc, file_id, created_at, delivered_at |
| `reviews` | id, appointment_id (unique), patient_id, doctor_id, rating, comment, status, created_at |

**Clinical**

| Table | Key columns |
|---|---|
| `care_relationships` | id, patient_id, doctor_id, started_at, ended_at, source_appointment_id |
| `record_access_grants` | id, patient_id, grantee_user_id, scope, granted_by, expires_at, revoked_at |
| `encounters` | id, appointment_id, patient_id, doctor_id, summary_enc, diagnosis_enc, follow_up_instructions_enc, signed_at, version |
| `prescriptions` | id, encounter_id, doctor_id, patient_id, status (DRAFT/ISSUED/AMENDED/REVOKED), issued_at, pdf_file_id, version |
| `prescription_items` | id, prescription_id, medicine_name, dosage, frequency, duration, instructions |
| `files` | id, owner_user_id, purpose, storage_key, mime, size_bytes, sha256, scan_status, created_at |
| `ai_interactions` | id, user_id, appointment_id, purpose, model, input_redaction_level, output, status (DRAFT/APPROVED/REJECTED), reviewed_by, reviewed_at |

**Money**

| Table | Key columns |
|---|---|
| `payments` | id, appointment_id, provider, provider_order_id (unique), provider_payment_id, amount_paise, currency, status, idempotency_key (unique), captured_at |
| `refunds` | id, payment_id, amount_paise, reason, status, provider_refund_id (unique), requested_by, approved_by |
| `ledger_entries` | id, occurred_at, account (PLATFORM_REVENUE, DOCTOR_PAYABLE, GATEWAY_FEE, REFUND, TAX), direction (DEBIT/CREDIT), amount_paise, appointment_id, payment_id, refund_id, meta |
| `settlements` | id, doctor_id, period, gross_paise, commission_paise, net_paise, status, provider_ref |
| `webhook_events` | id, provider, event_id (unique per provider), type, payload, received_at, processed_at, status, attempts |
| `subscription_plans` | id, code, name, price_paise, interval, features jsonb |
| `doctor_subscriptions` | id, doctor_id, plan_id, status, current_period_end, provider_sub_ref |

**Operations**

| Table | Key columns |
|---|---|
| `notifications` | id, user_id, channel, template, status, sent_at |
| `notification_preferences` | user_id, channel, event_type, enabled |
| `audit_logs` | id, at, actor_user_id, actor_role, action, resource_type, resource_id, outcome, ip, request_id, meta (no PHI) |
| `outbox_events` | id, aggregate, type, payload, created_at, dispatched_at |

### 6.3 Critical constraints

```sql
-- No double-booking: one doctor cannot have overlapping active appointments
ALTER TABLE appointments
  ADD CONSTRAINT no_overlap
  EXCLUDE USING gist (doctor_id WITH =, period WITH &&)
  WHERE (status IN ('HELD','CONFIRMED','READY','IN_PROGRESS'));

-- One session per appointment, one review per appointment
-- Unique(provider, event_id) on webhook_events for idempotent intake
-- Unique(provider_order_id), Unique(provider_refund_id)
-- Check: amounts >= 0; refunds.sum <= payments.amount (enforced in transaction + trigger)
-- audit_logs: REVOKE UPDATE, DELETE from the app role (append-only)
```

### 6.4 Indexes (initial)

- `doctor_profiles (status, practice_type)`, GIN on `languages`, trigram on `display_name`.
- `appointments (doctor_id, period)` via the GiST exclusion; `(patient_id, created_at desc)`.
- `payments (status, created_at)`, `webhook_events (status, received_at)`.
- `audit_logs (resource_type, resource_id, at desc)`.

### 6.5 Backups and retention

- Daily automated backup + point-in-time recovery if the provider supports it; **restore test every month**.
- Clinical record retention follows applicable law (to be confirmed by compliance review); deletion requests are handled by policy, not an automatic button.
- Search/analytics read from non-clinical views only.

---

## 7. Data flow — core journeys

### 7.1 Scheduled booking
1. Patient searches `GET /v1/doctors?specialty=&lang=&available=`.
2. Patient opens a doctor and requests slots `GET /v1/doctors/:id/slots?from&to`. The server generates them from availability rules minus exceptions minus active appointments, in the doctor's TZ.
3. Patient selects a slot and `POST /v1/appointments` with an `Idempotency-Key`.
4. Server transaction: re-check eligibility → snapshot fee, commission and policy version → insert `HELD` appointment (exclusion constraint rejects a clash) → create payment order with Razorpay → schedule `hold-expiry` job.
5. Web opens Razorpay Checkout.
6. Razorpay calls `POST /v1/webhooks/razorpay`. The server verifies the signature, stores the event idempotently, marks the payment captured, moves the appointment to `CONFIRMED`, writes ledger entries, and enqueues confirmation emails.
7. Browser success screen only polls `GET /v1/appointments/:id` — it never confirms anything.

### 7.2 Instant consultation
1. Patient posts `POST /v1/instant` (specialty, mode) after the emergency screen.
2. Matching finds doctors who are verified, online (Redis presence), entitled, not in session.
3. Offer sent over WebSocket to doctor(s); the first to accept wins (atomic compare-and-set).
4. System creates a short `HELD` appointment starting "now" and a payment order; patient pays; webhook confirms.
5. If nobody accepts within the timeout, the request becomes queue or "book instead"; the patient is never charged without an accepted doctor.

### 7.3 Consultation
1. When the join window opens (e.g., 10 min before), `POST /v1/consultations/:apptId/join` checks the participant and eligibility, then returns a short-lived provider token.
2. The waiting room shows status over WebSocket. The session moves `READY → IN_PROGRESS` when the doctor joins.
3. Chat messages go through the gateway, are persisted and authorized per message.
4. Doctor ends the call, writes the encounter, optionally issues a prescription (signed and PDF stored).
5. Appointment `COMPLETED`; review window opens; follow-up booking offered.

### 7.4 Cancellation and refund
1. `POST /v1/appointments/:id/cancel` → policy engine computes refund → ledger entries → `PaymentProvider.refund()` with idempotency key → `refunds` row `PENDING`.
2. Refund webhook updates status; patient sees status; failures go to the admin queue.

### 7.5 Doctor onboarding
Apply or accept invite → profile → credential upload (private storage) → agreement accepted → admin review (manual) → `VERIFIED` → profile publicly listed → expiry reminders scheduled.

### 7.6 AI-assisted intake (flagged)
Patient answers structured intake questions → server redacts identifiers → AI drafts a structured summary → doctor sees "AI-drafted, unverified" → doctor edits or approves → only approved content enters the record.

---

## 8. Security architecture

| Concern | Control |
|---|---|
| Transport | TLS everywhere, HSTS, secure cookies |
| AuthN | Argon2id, short JWT (≈15 min), rotating refresh with reuse detection, MFA for doctors/admins |
| AuthZ | Role + resource policy on every endpoint; deny by default |
| Input | zod validation, size limits, parameterized queries (Prisma) |
| Files | Private bucket, signed URLs ≤ 5 min, MIME/size allow-list, malware scan before availability |
| Video | Auth-gated room creation, per-user short-lived tokens, no recording by default |
| Payments | Signature verification, idempotency, reconciliation, no card data touches DocTALK |
| Secrets | Env/secret manager only; rotation runbook; never in frontend |
| Logging | Structured logs, PHI/secret redaction, request IDs |
| Audit | Append-only; read access to records and all admin actions logged |
| Rate limiting | Per-IP and per-user on auth, OTP, booking, search |
| Dependencies | Dependabot, `pnpm audit`, SAST in CI |
| Headers | CSP, X-Content-Type-Options, frame-ancestors, referrer policy |
| Abuse | Report doctor/patient, admin suspension, blocklist |

### 8.1 Role–permission matrix (summary)

| Capability | Patient | Doctor | Support | Admin |
|---|---|---|---|---|
| Search/view verified doctors | ✔ | ✔ | ✔ | ✔ |
| Book/cancel own appointment | ✔ | — | — | ✔ (override, audited) |
| View own records | ✔ | — | — | — |
| View patient record | — | only with care relationship/grant | — | break-glass, audited |
| Issue prescription | — | ✔ (verified) | — | — |
| Verify doctors | — | — | — | ✔ |
| Approve refund exceptions | — | — | ✔ (limit) | ✔ |
| Read audit logs | — | — | — | ✔ |

---

## 9. Compliance and clinical safety (design for, then confirm with counsel)

1. **Indian telemedicine rules:** design for registered practitioners, patient identification, consent, and prescription constraints under applicable telemedicine guidelines. Confirm exact current requirements with counsel.
2. **Data protection:** design for notice, purpose-limited consent, access/correction/erasure handling, breach response, and data-localisation sensitivity. Confirm against the current Indian data-protection law and rules.
3. **Provider roles:** define who is the healthcare provider and data fiduciary/processor for managed-clinic doctors vs independent doctors (O-4 interacts here).
4. **Emergencies:** persistent emergency guidance, local emergency number, no booking promise for emergencies, escalation process.
5. **International (later):** a doctor's visibility abroad does not imply they can lawfully treat there. Per-country licensing, prescribing and data-transfer rules gate every new country.
6. **Payments:** gateway KYC for the business; marketplace payouts need a provider-supported split/route arrangement; tax treatment to be confirmed with an accountant.

### 9.4 Doctor payout options

| Option | Notes |
|---|---|
| A. Gateway marketplace split (e.g., Razorpay Route) | Automates settlements; requires doctor KYC onboarding and gateway approval |
| B. Collect to platform, manual payouts | Simplest and cheapest start; reconcile via ledger; compliance and tax handling needed |
| Recommendation | Start with B for the pilot, move to A once volumes and approvals justify it |

---

## 10. Subscription entitlements (launch)

| Plan | Included |
|---|---|
| Free | Profile, verification, basic availability and appointment management |
| Premium | Extra scheduling tools, analytics, reminders, practice tools, priority in instant matching (must not block patient access to care) |
| Managed | Terms negotiated separately; flagged via `practice_type = MANAGED` and agreement |

Entitlements are checked server-side through `subscriptions.hasFeature(doctorId, feature)`; never trust the UI.

---

## 11. Internationalisation and time zones

- All strings externalised; locale routing ready; English only at launch.
- Store UTC; store each doctor's IANA time zone and each patient's preferred time zone.
- Currency stored with each payment; INR only at launch; price display via `Intl.NumberFormat`.
- Country field on doctors and patients now, so future country filters need no migration.

---

## 12. Environments and deployment

| Env | Purpose | Notes |
|---|---|---|
| local | Dev | docker-compose: Postgres, Redis, MinIO, Mailpit, provider sandbox keys |
| staging | QA, UAT | Razorpay test mode, video sandbox, seeded fake data only |
| production | Real users | Live keys, backups, alerts, restricted access |

- Never copy production PHI to staging.
- CI: lint → typecheck → unit → integration (Testcontainers) → build → e2e smoke → deploy → migrate.
- Migrations are forward-only and backward-compatible for one release (expand/contract).
- Feature flags: `INSTANT_CONSULT`, `AI_INTAKE`, `AI_SUMMARY`, `SUBSCRIPTIONS`, `INTL`.

---

## 13. Observability and operations

- Metrics: request latency, error rate, queue depth, webhook failures, join success rate, call quality, payment success.
- Alerts: webhook failures, payment mismatch, queue backlog, 5xx rate, DB storage, cert expiry.
- Runbooks: payment mismatch, provider outage, DB restore, credential leak, data breach (see rollback.md).
- Support tooling: admin can view appointment timeline (no clinical content unless break-glass).

---

## 14. Performance targets (starter)

| Metric | Target |
|---|---|
| Search API p95 | < 400 ms |
| Booking transaction p95 | < 800 ms |
| Join-token issuance | < 500 ms |
| Webhook processing | < 2 s, retried up to N times |
| Availability | 99.5% at pilot (honest target for a small team) |

---

## 15. Risks

| Risk | Mitigation |
|---|---|
| Regulatory misstep | Counsel review before pilot; feature-gate risky features |
| Free-tier limits hit | Cost register, alerts, provider abstraction |
| Video quality on poor networks | Audio fallback, chat fallback, device check, reconnect UX |
| Fake doctors | Manual verification, expiry checks, report flow |
| Payment mismatch | Webhook-first, nightly reconcile, ledger |
| Double-booking | DB exclusion constraint + transaction + tests |
| PHI leakage | Redaction, audit, least privilege, no PHI in logs/emails |
| Solo-developer overload | Phase gating, modular monolith, strict scope |

## 16. Cost register (fill with verified numbers before pilot)

| Service | Free allowance (verify) | Unit price beyond | Owner check date |
|---|---|---|---|
| Hosting (web/api) | | | |
| PostgreSQL | | | |
| Redis | | | |
| Object storage | | | |
| Video/audio | | | |
| Email | | | |
| AI | | | |
| Domain/CDN | | | |
| Monitoring | | | |

## 17. Glossary

PHI: protected/personal health information · RBAC: role-based access control · PWA: progressive web app · bps: basis points (100 bps = 1%) · Paise: 1/100 rupee.
