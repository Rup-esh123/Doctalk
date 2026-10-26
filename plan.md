# DocTALK — Execution Plan

> Companion to `architecture.md`. This is the *what and in what order*; `progress.md` is the tracked checklist of the exact same IDs.
> Rule: do not start a phase until the previous phase's exit criteria are met. Ship a thin vertical slice in each phase.

## Phase overview

| Phase | Name | Outcome | Exit criteria |
|---|---|---|---|
| P0 | Foundations, compliance setup and tooling | Repo, CI, environments, legal review kickoff, open decisions closed | CI green on empty app; O-1..O-4 decided; legal reviewer engaged |
| P1 | Identity and doctor onboarding | Register/login/MFA, doctor application + invite, credential verification | Doctor can apply, be verified by admin, and log in with MFA; patient can register |
| P2 | Discovery and scheduled booking | Search, profiles, availability, slot holds, booking state machine | Patient can book a held slot; double-booking impossible under concurrency test |
| P3 | Payments, commission and refunds | Razorpay orders/webhooks, ledger, tiered commission, refund policy | Test-mode payment confirms booking only via webhook; refunds follow policy; ledger balances |
| P4 | Telemedicine: video, audio, chat, instant | Provider adapter, waiting room, live room, chat, instant queue | Two real devices complete video, audio and chat consults; instant request works |
| P5 | Records, prescriptions and notifications | Encounters, access control, prescriptions, files, reminders | Doctor issues prescription; patient views; every record read is audited |
| P6 | Subscriptions, reviews, admin ops and AI assist | Doctor plans, reviews, disputes, flagged AI intake/summary | Premium entitlements enforced; admin can resolve disputes; AI features togglable and approval-gated |
| P7 | Hardening and controlled pilot | Security review, load/chaos tests, backups, runbooks, pilot go-live | Security checklist passed; restore drill done; pilot go/no-go signed |
| P8 | Post-pilot: Hindi/Bengali and international | i18n content, maps/nearby, country rules, time-zone polish | Hindi/Bengali live; first non-India country passes legal gate |

## Suggested sequencing (solo/student pace, adjust freely)

| Phase | Rough effort (weeks) |
|---|---|
| P0 | 1–2 |
| P1 | 3 |
| P2 | 3 |
| P3 | 3 |
| P4 | 4 |
| P5 | 3 |
| P6 | 3 |
| P7 | 3 |
| P8 | after pilot |

These are planning guesses, not commitments; re-estimate after P1.

---

# Frontend

## P0 — Foundations, compliance setup and tooling

### FE-P0.1 Project setup
1. **FE-P0.1.1** Create pnpm + Turborepo monorepo with apps/web
2. **FE-P0.1.2** Configure Next.js, TypeScript strict, ESLint, Prettier
3. **FE-P0.1.3** Install Tailwind and shadcn/ui; define design tokens
4. **FE-P0.1.4** Set up next-intl with en.json and string-extraction lint rule
5. **FE-P0.1.5** Add Sentry, env validation and .env.example

### FE-P0.2 CI and quality
1. **FE-P0.2.1** GitHub Actions: lint, typecheck, build
2. **FE-P0.2.2** Add Vitest + Playwright skeleton and one smoke test
3. **FE-P0.2.3** Add accessibility linting (eslint-plugin-jsx-a11y) and axe in e2e

## P1 — Identity and doctor onboarding

### FE-P1.1 Auth screens
1. **FE-P1.1.1** Build login, patient register, doctor register pages with Zod forms
2. **FE-P1.1.2** Email verification and password-reset pages
3. **FE-P1.1.3** TOTP MFA enrol and challenge screens
4. **FE-P1.1.4** Session handling via httpOnly cookies, silent refresh, role-based redirect middleware

### FE-P1.2 Doctor onboarding wizard
1. **FE-P1.2.1** Profile step (bio, specialty, languages, fee, time zone)
2. **FE-P1.2.2** Credential upload step with progress and validation
3. **FE-P1.2.3** Agreement acceptance step and pending-verification status page
4. **FE-P1.2.4** Invite-link acceptance flow

## P2 — Discovery and scheduled booking

### FE-P2.1 Search and profile
1. **FE-P2.1.1** Doctor search page with filters and pagination
2. **FE-P2.1.2** Doctor profile page (verified badge, fee, next slots, languages)
3. **FE-P2.1.3** SEO metadata and sitemap for verified doctors

### FE-P2.2 Booking UI
1. **FE-P2.2.1** Slot picker rendering in patient time zone
2. **FE-P2.2.2** Fee breakdown and cancellation policy panel
3. **FE-P2.2.3** Booking confirmation and appointment list/detail pages
4. **FE-P2.2.4** Doctor schedule editor (weekly rules and exceptions)

## P3 — Payments, commission and refunds

### FE-P3.1 Checkout
1. **FE-P3.1.1** Integrate Razorpay Checkout from server-created order
2. **FE-P3.1.2** Payment pending/success/failed states that poll the server
3. **FE-P3.1.3** Payment history and receipt page

### FE-P3.2 Cancellation and refunds
1. **FE-P3.2.1** Cancel dialog showing computed refund before confirm
2. **FE-P3.2.2** Refund status tracker
3. **FE-P3.2.3** Doctor earnings page with commission breakdown

## P4 — Telemedicine: video, audio, chat, instant

### FE-P4.1 Consult room
1. **FE-P4.1.1** Device check and network test component
2. **FE-P4.1.2** Waiting room with live status over WebSocket
3. **FE-P4.1.3** Video/audio room using provider SDK with mute/camera/leave
4. **FE-P4.1.4** Reconnect and degraded-network handling (audio-only fallback)
5. **FE-P4.1.5** In-room chat panel with attachments

### FE-P4.2 Instant consult
1. **FE-P4.2.1** Instant request flow with emergency screen first
2. **FE-P4.2.2** Searching/accepted/queued/fallback-to-schedule states
3. **FE-P4.2.3** Doctor availability toggle and incoming-offer modal

## P5 — Records, prescriptions and notifications

### FE-P5.1 Clinical UI
1. **FE-P5.1.1** Doctor encounter editor (notes, diagnosis, follow-up) with autosave drafts
2. **FE-P5.1.2** Prescription builder and preview
3. **FE-P5.1.3** Patient records and prescription viewer with signed-URL download
4. **FE-P5.1.4** Patient document upload and sharing controls

## P6 — Subscriptions, reviews, admin ops and AI assist

### FE-P6.1 Plans and reviews
1. **FE-P6.1.1** Doctor plan comparison and upgrade pages
2. **FE-P6.1.2** Post-visit review form
3. **FE-P6.1.3** Entitlement-aware UI hints (server remains authority)

### FE-P6.2 Admin portal
1. **FE-P6.2.1** Verification queue and credential viewer
2. **FE-P6.2.2** Refund exception and dispute screens
3. **FE-P6.2.3** Audit log search
4. **FE-P6.2.4** Config screens (policies, plans, flags)

### FE-P6.3 AI assist UI
1. **FE-P6.3.1** Patient intake chat/form with clear AI disclosure
2. **FE-P6.3.2** Doctor view of AI-drafted summary with edit/approve/reject

## P7 — Hardening and controlled pilot

### FE-P7.1 Hardening
1. **FE-P7.1.1** CSP, security headers and cookie audit
2. **FE-P7.1.2** Accessibility audit and fixes to WCAG 2.1 AA
3. **FE-P7.1.3** Performance budget (LCP, bundle size) and fixes
4. **FE-P7.1.4** Cross-browser/device test on real phones
5. **FE-P7.1.5** Error, offline and empty states everywhere

## P8 — Post-pilot: Hindi/Bengali and international

### FE-P8.1 Localisation
1. **FE-P8.1.1** Add hi.json and bn.json with translator review
2. **FE-P8.1.2** Locale switcher and locale-aware formatting

### FE-P8.2 International and maps
1. **FE-P8.2.1** Country filter and doctor-country display
2. **FE-P8.2.2** Nearby-doctor map (provider TBD) behind flag
3. **FE-P8.2.3** Time-zone conversion UX polish

---

# Backend

## P0 — Foundations, compliance setup and tooling

### BE-P0.1 Project setup
1. **BE-P0.1.1** Create apps/api NestJS with config module and zod env schema
2. **BE-P0.1.2** Health/readiness endpoints, pino logging, request IDs
3. **BE-P0.1.3** Provider adapter interfaces (video, payment, email, storage, AI)
4. **BE-P0.1.4** Docker compose for Postgres, Redis, MinIO, Mailpit

### BE-P0.2 Governance
1. **BE-P0.2.1** Close open decisions O-1 to O-4 with product owner
2. **BE-P0.2.2** Engage healthcare-law reviewer; list questions
3. **BE-P0.2.3** Draft policy documents: terms, privacy, consent, cancellation

## P1 — Identity and doctor onboarding

### BE-P1.1 Auth module
1. **BE-P1.1.1** Register/login with Argon2id and rate limits
2. **BE-P1.1.2** JWT access + rotating refresh with reuse detection
3. **BE-P1.1.3** Email verification and password reset
4. **BE-P1.1.4** TOTP MFA, enforced for doctors and admins
5. **BE-P1.1.5** Roles guard and policy guard framework

### BE-P1.2 Doctor onboarding
1. **BE-P1.2.1** Doctor profile and specialty/language endpoints
2. **BE-P1.2.2** Credential upload via signed URLs and status workflow
3. **BE-P1.2.3** Admin verify/reject/needs-info endpoints with audit
4. **BE-P1.2.4** Invite token generation and acceptance
5. **BE-P1.2.5** Agreement versioning and acceptance

## P2 — Discovery and scheduled booking

### BE-P2.1 Search
1. **BE-P2.1.1** Doctor search endpoint (filters, ranking, pagination)
2. **BE-P2.1.2** Only VERIFIED + agreement-accepted doctors returned

### BE-P2.2 Scheduling
1. **BE-P2.2.1** Availability rules and exceptions CRUD
2. **BE-P2.2.2** Slot generation in doctor TZ, returned as UTC
3. **BE-P2.2.3** Booking transaction with fee/commission/policy snapshots
4. **BE-P2.2.4** Hold-expiry job
5. **BE-P2.2.5** Reschedule and appointment state-machine enforcement

## P3 — Payments, commission and refunds

### BE-P3.1 Payments
1. **BE-P3.1.1** Razorpay adapter: create order, verify signature
2. **BE-P3.1.2** Webhook endpoint with idempotent event store
3. **BE-P3.1.3** Payment-to-appointment confirmation transaction
4. **BE-P3.1.4** Nightly reconcile job

### BE-P3.2 Ledger and refunds
1. **BE-P3.2.1** Ledger entries for payment, commission, gateway fee
2. **BE-P3.2.2** Tiered commission from versioned agreement
3. **BE-P3.2.3** Policy engine computing refund by actor and timing
4. **BE-P3.2.4** Idempotent refund execution and refund webhooks
5. **BE-P3.2.5** Admin exception approval

### BE-P3.3 Payouts
1. **BE-P3.3.1** Doctor settlement report (CSV) for manual payouts
2. **BE-P3.3.2** Spike: gateway marketplace-split feasibility

## P4 — Telemedicine: video, audio, chat, instant

### BE-P4.1 Video/audio/chat
1. **BE-P4.1.1** Provider spike and final selection (LiveKit vs 100ms vs other)
2. **BE-P4.1.2** Room creation and token issuance within join window
3. **BE-P4.1.3** Session lifecycle and provider webhooks
4. **BE-P4.1.4** Socket.IO gateway: auth, per-appointment rooms, persistence
5. **BE-P4.1.5** No-show sweeper and technical-failure handling

### BE-P4.2 Instant
1. **BE-P4.2.1** Doctor presence via Redis heartbeat
2. **BE-P4.2.2** Matching and atomic accept
3. **BE-P4.2.3** Payment flow for instant booking
4. **BE-P4.2.4** Queue and expiry jobs

## P5 — Records, prescriptions and notifications

### BE-P5.1 Records
1. **BE-P5.1.1** Care relationships and access grants
2. **BE-P5.1.2** Encounter CRUD with encryption and audit-on-read
3. **BE-P5.1.3** Break-glass access with reason and alert

### BE-P5.2 Prescriptions and files
1. **BE-P5.2.1** Prescription draft/issue/amend with PDF generation
2. **BE-P5.2.2** File upload pipeline with MIME checks and malware scan
3. **BE-P5.2.3** Signed download URLs

### BE-P5.3 Notifications
1. **BE-P5.3.1** Email provider adapter and templates (no clinical content)
2. **BE-P5.3.2** Reminder scheduler T-24h/T-1h/T-10m
3. **BE-P5.3.3** Notification preferences

## P6 — Subscriptions, reviews, admin ops and AI assist

### BE-P6.1 Subscriptions and reviews
1. **BE-P6.1.1** Plans and entitlements service
2. **BE-P6.1.2** Subscription checkout and renewal via gateway
3. **BE-P6.1.3** Review eligibility rules and rating aggregation

### BE-P6.2 Admin ops
1. **BE-P6.2.1** Dispute workflow and refund overrides
2. **BE-P6.2.2** Credential expiry reminders and auto-suspend
3. **BE-P6.2.3** Admin metrics endpoints

### BE-P6.3 AI
1. **BE-P6.3.1** AiProvider adapter with redaction, budget cap and kill-switch
2. **BE-P6.3.2** Intake summary draft endpoint
3. **BE-P6.3.3** Approval workflow persisted in ai_interactions

## P7 — Hardening and controlled pilot

### BE-P7.1 Security and reliability
1. **BE-P7.1.1** Threat model review and fixes
2. **BE-P7.1.2** Pen-test style checks (OWASP ASVS L2 subset)
3. **BE-P7.1.3** Load test booking and webhooks
4. **BE-P7.1.4** Chaos tests: provider outage, Redis down, DB failover
5. **BE-P7.1.5** Runbooks and alert tuning
6. **BE-P7.1.6** Dependency and secret scanning gates

## P8 — Post-pilot: Hindi/Bengali and international

### BE-P8.1 International
1. **BE-P8.1.1** Country-based rules table (licensing/prescribing gates)
2. **BE-P8.1.2** Multi-currency payments design and tests
3. **BE-P8.1.3** Cross-border data-transfer review

---

# Database

## P0 — Foundations, compliance setup and tooling

### DB-P0.1 Setup
1. **DB-P0.1.1** Provision local and staging Postgres; enable extensions
2. **DB-P0.1.2** Prisma init and migration pipeline in CI
3. **DB-P0.1.3** Seed script with fake data only
4. **DB-P0.1.4** Backup policy chosen and documented

## P1 — Identity and doctor onboarding

### DB-P1.1 Identity schema
1. **DB-P1.1.1** users, refresh_tokens, consents, policy_documents
2. **DB-P1.1.2** patient_profiles, doctor_profiles, specialties, doctor_specialties
3. **DB-P1.1.3** doctor_credentials, doctor_agreements
4. **DB-P1.1.4** files and audit_logs (append-only grants)

## P2 — Discovery and scheduled booking

### DB-P2.1 Scheduling schema
1. **DB-P2.1.1** doctor_availability_rules and availability_exceptions
2. **DB-P2.1.2** appointments with tstzrange and GiST exclusion constraint
3. **DB-P2.1.3** Search indexes (GIN languages, trigram names)
4. **DB-P2.1.4** Concurrency test: parallel bookings cannot overlap

## P3 — Payments, commission and refunds

### DB-P3.1 Money schema
1. **DB-P3.1.1** payments, refunds, webhook_events with unique keys
2. **DB-P3.1.2** ledger_entries and settlements
3. **DB-P3.1.3** Triggers/checks: refund total <= payment
4. **DB-P3.1.4** Reconciliation SQL views

## P4 — Telemedicine: video, audio, chat, instant

### DB-P4.1 Consultation schema
1. **DB-P4.1.1** consultation_sessions, chat_messages, instant_requests
2. **DB-P4.1.2** Chat index and retention rules
3. **DB-P4.1.3** Presence stays in Redis (document key schema and TTL)

## P5 — Records, prescriptions and notifications

### DB-P5.1 Clinical schema
1. **DB-P5.1.1** care_relationships, record_access_grants
2. **DB-P5.1.2** encounters, prescriptions, prescription_items
3. **DB-P5.1.3** Field-level encryption for sensitive columns
4. **DB-P5.1.4** Record-access views for analytics (non-clinical only)

## P6 — Subscriptions, reviews, admin ops and AI assist

### DB-P6.1 Business schema
1. **DB-P6.1.1** subscription_plans, doctor_subscriptions
2. **DB-P6.1.2** reviews with eligibility constraints
3. **DB-P6.1.3** ai_interactions
4. **DB-P6.1.4** notifications and notification_preferences
5. **DB-P6.1.5** outbox_events

## P7 — Hardening and controlled pilot

### DB-P7.1 Operations
1. **DB-P7.1.1** Backup restore drill and timing recorded
2. **DB-P7.1.2** Slow-query review and index tuning
3. **DB-P7.1.3** Data retention and deletion policy implemented per legal advice
4. **DB-P7.1.4** Role separation: migration role, app role, read-only analytics role

## P8 — Post-pilot: Hindi/Bengali and international

### DB-P8.1 Expansion
1. **DB-P8.1.1** Country and locale reference tables
2. **DB-P8.1.2** Multi-currency fields verified
3. **DB-P8.1.3** Partitioning plan for chat and audit tables

---

# Cross-cutting rules for every phase

- Each step ends with: code + tests + docs updated + `progress.md` ticked + `handoff.md` entry.
- Any step touching auth, payments, records or files needs a second-look review against `architecture.md` section 8.
- Any new decision gets a `decisions.md` entry the same day.
- Any migration gets a rollback note in `rollback.md` before merge.
