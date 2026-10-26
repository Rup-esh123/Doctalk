# DocTALK — Progress Tracker

> Same IDs as `plan.md`. Tick `[x]` only when the step's **verification** is done (see `test-checklists.md`). Update at the end of every session.

**Legend:** `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked (add note)

## Dashboard

| Phase | Frontend | Backend | Database | Status | Owner | Started | Done |
|---|---|---|---|---|---|---|---|
| P0 Foundations, compliance setup and tooling | 0/8 | 0/7 | 0/4 | Not started | | | |
| P1 Identity and doctor onboarding | 0/8 | 0/10 | 0/4 | Not started | | | |
| P2 Discovery and scheduled booking | 0/7 | 0/7 | 0/4 | Not started | | | |
| P3 Payments, commission and refunds | 0/6 | 0/11 | 0/4 | Not started | | | |
| P4 Telemedicine: video, audio, chat, instant | 0/8 | 0/9 | 0/3 | Not started | | | |
| P5 Records, prescriptions and notifications | 0/4 | 0/9 | 0/4 | Not started | | | |
| P6 Subscriptions, reviews, admin ops and AI assist | 0/9 | 0/9 | 0/5 | Not started | | | |
| P7 Hardening and controlled pilot | 0/5 | 0/6 | 0/4 | Not started | | | |
| P8 Post-pilot: Hindi/Bengali and international | 0/5 | 0/3 | 0/3 | Not started | | | |

**Total steps:** 166 · **Completed:** 0 · **Blocked:** 0

## Open decisions blocking work

- [ ] O-1 Doctor verification depth (default: manual + expiry reminders)
- [ ] O-2 Emergency handling policy (default: guidance + redirect, no AI-only triage)
- [ ] O-3 AI scope at launch (default: intake + clinician-approved summaries, behind flags)
- [ ] O-4 Clinical-record access model (default: per-care-relationship authorization)
- [ ] Commission percentages, refund windows, subscription price
- [ ] Healthcare-law review scheduled
- [ ] Video provider chosen (P4 spike)

---

# Frontend

## P0 — Foundations, compliance setup and tooling

### FE-P0.1 Project setup

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | FE-P0.1.1 | Create pnpm + Turborepo monorepo with apps/web | | | |
| [ ] | FE-P0.1.2 | Configure Next.js, TypeScript strict, ESLint, Prettier | | | |
| [ ] | FE-P0.1.3 | Install Tailwind and shadcn/ui; define design tokens | | | |
| [ ] | FE-P0.1.4 | Set up next-intl with en.json and string-extraction lint rule | | | |
| [ ] | FE-P0.1.5 | Add Sentry, env validation and .env.example | | | |

### FE-P0.2 CI and quality

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | FE-P0.2.1 | GitHub Actions: lint, typecheck, build | | | |
| [ ] | FE-P0.2.2 | Add Vitest + Playwright skeleton and one smoke test | | | |
| [ ] | FE-P0.2.3 | Add accessibility linting (eslint-plugin-jsx-a11y) and axe in e2e | | | |

**P0 Frontend exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P1 — Identity and doctor onboarding

### FE-P1.1 Auth screens

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | FE-P1.1.1 | Build login, patient register, doctor register pages with Zod forms | | | |
| [ ] | FE-P1.1.2 | Email verification and password-reset pages | | | |
| [ ] | FE-P1.1.3 | TOTP MFA enrol and challenge screens | | | |
| [ ] | FE-P1.1.4 | Session handling via httpOnly cookies, silent refresh, role-based redirect middleware | | | |

### FE-P1.2 Doctor onboarding wizard

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | FE-P1.2.1 | Profile step (bio, specialty, languages, fee, time zone) | | | |
| [ ] | FE-P1.2.2 | Credential upload step with progress and validation | | | |
| [ ] | FE-P1.2.3 | Agreement acceptance step and pending-verification status page | | | |
| [ ] | FE-P1.2.4 | Invite-link acceptance flow | | | |

**P1 Frontend exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P2 — Discovery and scheduled booking

### FE-P2.1 Search and profile

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | FE-P2.1.1 | Doctor search page with filters and pagination | | | |
| [ ] | FE-P2.1.2 | Doctor profile page (verified badge, fee, next slots, languages) | | | |
| [ ] | FE-P2.1.3 | SEO metadata and sitemap for verified doctors | | | |

### FE-P2.2 Booking UI

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | FE-P2.2.1 | Slot picker rendering in patient time zone | | | |
| [ ] | FE-P2.2.2 | Fee breakdown and cancellation policy panel | | | |
| [ ] | FE-P2.2.3 | Booking confirmation and appointment list/detail pages | | | |
| [ ] | FE-P2.2.4 | Doctor schedule editor (weekly rules and exceptions) | | | |

**P2 Frontend exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P3 — Payments, commission and refunds

### FE-P3.1 Checkout

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | FE-P3.1.1 | Integrate Razorpay Checkout from server-created order | | | |
| [ ] | FE-P3.1.2 | Payment pending/success/failed states that poll the server | | | |
| [ ] | FE-P3.1.3 | Payment history and receipt page | | | |

### FE-P3.2 Cancellation and refunds

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | FE-P3.2.1 | Cancel dialog showing computed refund before confirm | | | |
| [ ] | FE-P3.2.2 | Refund status tracker | | | |
| [ ] | FE-P3.2.3 | Doctor earnings page with commission breakdown | | | |

**P3 Frontend exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P4 — Telemedicine: video, audio, chat, instant

### FE-P4.1 Consult room

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | FE-P4.1.1 | Device check and network test component | | | |
| [ ] | FE-P4.1.2 | Waiting room with live status over WebSocket | | | |
| [ ] | FE-P4.1.3 | Video/audio room using provider SDK with mute/camera/leave | | | |
| [ ] | FE-P4.1.4 | Reconnect and degraded-network handling (audio-only fallback) | | | |
| [ ] | FE-P4.1.5 | In-room chat panel with attachments | | | |

### FE-P4.2 Instant consult

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | FE-P4.2.1 | Instant request flow with emergency screen first | | | |
| [ ] | FE-P4.2.2 | Searching/accepted/queued/fallback-to-schedule states | | | |
| [ ] | FE-P4.2.3 | Doctor availability toggle and incoming-offer modal | | | |

**P4 Frontend exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P5 — Records, prescriptions and notifications

### FE-P5.1 Clinical UI

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | FE-P5.1.1 | Doctor encounter editor (notes, diagnosis, follow-up) with autosave drafts | | | |
| [ ] | FE-P5.1.2 | Prescription builder and preview | | | |
| [ ] | FE-P5.1.3 | Patient records and prescription viewer with signed-URL download | | | |
| [ ] | FE-P5.1.4 | Patient document upload and sharing controls | | | |

**P5 Frontend exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P6 — Subscriptions, reviews, admin ops and AI assist

### FE-P6.1 Plans and reviews

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | FE-P6.1.1 | Doctor plan comparison and upgrade pages | | | |
| [ ] | FE-P6.1.2 | Post-visit review form | | | |
| [ ] | FE-P6.1.3 | Entitlement-aware UI hints (server remains authority) | | | |

### FE-P6.2 Admin portal

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | FE-P6.2.1 | Verification queue and credential viewer | | | |
| [ ] | FE-P6.2.2 | Refund exception and dispute screens | | | |
| [ ] | FE-P6.2.3 | Audit log search | | | |
| [ ] | FE-P6.2.4 | Config screens (policies, plans, flags) | | | |

### FE-P6.3 AI assist UI

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | FE-P6.3.1 | Patient intake chat/form with clear AI disclosure | | | |
| [ ] | FE-P6.3.2 | Doctor view of AI-drafted summary with edit/approve/reject | | | |

**P6 Frontend exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P7 — Hardening and controlled pilot

### FE-P7.1 Hardening

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | FE-P7.1.1 | CSP, security headers and cookie audit | | | |
| [ ] | FE-P7.1.2 | Accessibility audit and fixes to WCAG 2.1 AA | | | |
| [ ] | FE-P7.1.3 | Performance budget (LCP, bundle size) and fixes | | | |
| [ ] | FE-P7.1.4 | Cross-browser/device test on real phones | | | |
| [ ] | FE-P7.1.5 | Error, offline and empty states everywhere | | | |

**P7 Frontend exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P8 — Post-pilot: Hindi/Bengali and international

### FE-P8.1 Localisation

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | FE-P8.1.1 | Add hi.json and bn.json with translator review | | | |
| [ ] | FE-P8.1.2 | Locale switcher and locale-aware formatting | | | |

### FE-P8.2 International and maps

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | FE-P8.2.1 | Country filter and doctor-country display | | | |
| [ ] | FE-P8.2.2 | Nearby-doctor map (provider TBD) behind flag | | | |
| [ ] | FE-P8.2.3 | Time-zone conversion UX polish | | | |

**P8 Frontend exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

---

# Backend

## P0 — Foundations, compliance setup and tooling

### BE-P0.1 Project setup

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | BE-P0.1.1 | Create apps/api NestJS with config module and zod env schema | | | |
| [ ] | BE-P0.1.2 | Health/readiness endpoints, pino logging, request IDs | | | |
| [ ] | BE-P0.1.3 | Provider adapter interfaces (video, payment, email, storage, AI) | | | |
| [ ] | BE-P0.1.4 | Docker compose for Postgres, Redis, MinIO, Mailpit | | | |

### BE-P0.2 Governance

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | BE-P0.2.1 | Close open decisions O-1 to O-4 with product owner | | | |
| [ ] | BE-P0.2.2 | Engage healthcare-law reviewer; list questions | | | |
| [ ] | BE-P0.2.3 | Draft policy documents: terms, privacy, consent, cancellation | | | |

**P0 Backend exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P1 — Identity and doctor onboarding

### BE-P1.1 Auth module

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | BE-P1.1.1 | Register/login with Argon2id and rate limits | | | |
| [ ] | BE-P1.1.2 | JWT access + rotating refresh with reuse detection | | | |
| [ ] | BE-P1.1.3 | Email verification and password reset | | | |
| [ ] | BE-P1.1.4 | TOTP MFA, enforced for doctors and admins | | | |
| [ ] | BE-P1.1.5 | Roles guard and policy guard framework | | | |

### BE-P1.2 Doctor onboarding

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | BE-P1.2.1 | Doctor profile and specialty/language endpoints | | | |
| [ ] | BE-P1.2.2 | Credential upload via signed URLs and status workflow | | | |
| [ ] | BE-P1.2.3 | Admin verify/reject/needs-info endpoints with audit | | | |
| [ ] | BE-P1.2.4 | Invite token generation and acceptance | | | |
| [ ] | BE-P1.2.5 | Agreement versioning and acceptance | | | |

**P1 Backend exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P2 — Discovery and scheduled booking

### BE-P2.1 Search

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | BE-P2.1.1 | Doctor search endpoint (filters, ranking, pagination) | | | |
| [ ] | BE-P2.1.2 | Only VERIFIED + agreement-accepted doctors returned | | | |

### BE-P2.2 Scheduling

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | BE-P2.2.1 | Availability rules and exceptions CRUD | | | |
| [ ] | BE-P2.2.2 | Slot generation in doctor TZ, returned as UTC | | | |
| [ ] | BE-P2.2.3 | Booking transaction with fee/commission/policy snapshots | | | |
| [ ] | BE-P2.2.4 | Hold-expiry job | | | |
| [ ] | BE-P2.2.5 | Reschedule and appointment state-machine enforcement | | | |

**P2 Backend exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P3 — Payments, commission and refunds

### BE-P3.1 Payments

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | BE-P3.1.1 | Razorpay adapter: create order, verify signature | | | |
| [ ] | BE-P3.1.2 | Webhook endpoint with idempotent event store | | | |
| [ ] | BE-P3.1.3 | Payment-to-appointment confirmation transaction | | | |
| [ ] | BE-P3.1.4 | Nightly reconcile job | | | |

### BE-P3.2 Ledger and refunds

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | BE-P3.2.1 | Ledger entries for payment, commission, gateway fee | | | |
| [ ] | BE-P3.2.2 | Tiered commission from versioned agreement | | | |
| [ ] | BE-P3.2.3 | Policy engine computing refund by actor and timing | | | |
| [ ] | BE-P3.2.4 | Idempotent refund execution and refund webhooks | | | |
| [ ] | BE-P3.2.5 | Admin exception approval | | | |

### BE-P3.3 Payouts

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | BE-P3.3.1 | Doctor settlement report (CSV) for manual payouts | | | |
| [ ] | BE-P3.3.2 | Spike: gateway marketplace-split feasibility | | | |

**P3 Backend exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P4 — Telemedicine: video, audio, chat, instant

### BE-P4.1 Video/audio/chat

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | BE-P4.1.1 | Provider spike and final selection (LiveKit vs 100ms vs other) | | | |
| [ ] | BE-P4.1.2 | Room creation and token issuance within join window | | | |
| [ ] | BE-P4.1.3 | Session lifecycle and provider webhooks | | | |
| [ ] | BE-P4.1.4 | Socket.IO gateway: auth, per-appointment rooms, persistence | | | |
| [ ] | BE-P4.1.5 | No-show sweeper and technical-failure handling | | | |

### BE-P4.2 Instant

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | BE-P4.2.1 | Doctor presence via Redis heartbeat | | | |
| [ ] | BE-P4.2.2 | Matching and atomic accept | | | |
| [ ] | BE-P4.2.3 | Payment flow for instant booking | | | |
| [ ] | BE-P4.2.4 | Queue and expiry jobs | | | |

**P4 Backend exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P5 — Records, prescriptions and notifications

### BE-P5.1 Records

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | BE-P5.1.1 | Care relationships and access grants | | | |
| [ ] | BE-P5.1.2 | Encounter CRUD with encryption and audit-on-read | | | |
| [ ] | BE-P5.1.3 | Break-glass access with reason and alert | | | |

### BE-P5.2 Prescriptions and files

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | BE-P5.2.1 | Prescription draft/issue/amend with PDF generation | | | |
| [ ] | BE-P5.2.2 | File upload pipeline with MIME checks and malware scan | | | |
| [ ] | BE-P5.2.3 | Signed download URLs | | | |

### BE-P5.3 Notifications

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | BE-P5.3.1 | Email provider adapter and templates (no clinical content) | | | |
| [ ] | BE-P5.3.2 | Reminder scheduler T-24h/T-1h/T-10m | | | |
| [ ] | BE-P5.3.3 | Notification preferences | | | |

**P5 Backend exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P6 — Subscriptions, reviews, admin ops and AI assist

### BE-P6.1 Subscriptions and reviews

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | BE-P6.1.1 | Plans and entitlements service | | | |
| [ ] | BE-P6.1.2 | Subscription checkout and renewal via gateway | | | |
| [ ] | BE-P6.1.3 | Review eligibility rules and rating aggregation | | | |

### BE-P6.2 Admin ops

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | BE-P6.2.1 | Dispute workflow and refund overrides | | | |
| [ ] | BE-P6.2.2 | Credential expiry reminders and auto-suspend | | | |
| [ ] | BE-P6.2.3 | Admin metrics endpoints | | | |

### BE-P6.3 AI

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | BE-P6.3.1 | AiProvider adapter with redaction, budget cap and kill-switch | | | |
| [ ] | BE-P6.3.2 | Intake summary draft endpoint | | | |
| [ ] | BE-P6.3.3 | Approval workflow persisted in ai_interactions | | | |

**P6 Backend exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P7 — Hardening and controlled pilot

### BE-P7.1 Security and reliability

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | BE-P7.1.1 | Threat model review and fixes | | | |
| [ ] | BE-P7.1.2 | Pen-test style checks (OWASP ASVS L2 subset) | | | |
| [ ] | BE-P7.1.3 | Load test booking and webhooks | | | |
| [ ] | BE-P7.1.4 | Chaos tests: provider outage, Redis down, DB failover | | | |
| [ ] | BE-P7.1.5 | Runbooks and alert tuning | | | |
| [ ] | BE-P7.1.6 | Dependency and secret scanning gates | | | |

**P7 Backend exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P8 — Post-pilot: Hindi/Bengali and international

### BE-P8.1 International

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | BE-P8.1.1 | Country-based rules table (licensing/prescribing gates) | | | |
| [ ] | BE-P8.1.2 | Multi-currency payments design and tests | | | |
| [ ] | BE-P8.1.3 | Cross-border data-transfer review | | | |

**P8 Backend exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

---

# Database

## P0 — Foundations, compliance setup and tooling

### DB-P0.1 Setup

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | DB-P0.1.1 | Provision local and staging Postgres; enable extensions | | | |
| [ ] | DB-P0.1.2 | Prisma init and migration pipeline in CI | | | |
| [ ] | DB-P0.1.3 | Seed script with fake data only | | | |
| [ ] | DB-P0.1.4 | Backup policy chosen and documented | | | |

**P0 Database exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P1 — Identity and doctor onboarding

### DB-P1.1 Identity schema

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | DB-P1.1.1 | users, refresh_tokens, consents, policy_documents | | | |
| [ ] | DB-P1.1.2 | patient_profiles, doctor_profiles, specialties, doctor_specialties | | | |
| [ ] | DB-P1.1.3 | doctor_credentials, doctor_agreements | | | |
| [ ] | DB-P1.1.4 | files and audit_logs (append-only grants) | | | |

**P1 Database exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P2 — Discovery and scheduled booking

### DB-P2.1 Scheduling schema

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | DB-P2.1.1 | doctor_availability_rules and availability_exceptions | | | |
| [ ] | DB-P2.1.2 | appointments with tstzrange and GiST exclusion constraint | | | |
| [ ] | DB-P2.1.3 | Search indexes (GIN languages, trigram names) | | | |
| [ ] | DB-P2.1.4 | Concurrency test: parallel bookings cannot overlap | | | |

**P2 Database exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P3 — Payments, commission and refunds

### DB-P3.1 Money schema

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | DB-P3.1.1 | payments, refunds, webhook_events with unique keys | | | |
| [ ] | DB-P3.1.2 | ledger_entries and settlements | | | |
| [ ] | DB-P3.1.3 | Triggers/checks: refund total <= payment | | | |
| [ ] | DB-P3.1.4 | Reconciliation SQL views | | | |

**P3 Database exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P4 — Telemedicine: video, audio, chat, instant

### DB-P4.1 Consultation schema

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | DB-P4.1.1 | consultation_sessions, chat_messages, instant_requests | | | |
| [ ] | DB-P4.1.2 | Chat index and retention rules | | | |
| [ ] | DB-P4.1.3 | Presence stays in Redis (document key schema and TTL) | | | |

**P4 Database exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P5 — Records, prescriptions and notifications

### DB-P5.1 Clinical schema

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | DB-P5.1.1 | care_relationships, record_access_grants | | | |
| [ ] | DB-P5.1.2 | encounters, prescriptions, prescription_items | | | |
| [ ] | DB-P5.1.3 | Field-level encryption for sensitive columns | | | |
| [ ] | DB-P5.1.4 | Record-access views for analytics (non-clinical only) | | | |

**P5 Database exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P6 — Subscriptions, reviews, admin ops and AI assist

### DB-P6.1 Business schema

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | DB-P6.1.1 | subscription_plans, doctor_subscriptions | | | |
| [ ] | DB-P6.1.2 | reviews with eligibility constraints | | | |
| [ ] | DB-P6.1.3 | ai_interactions | | | |
| [ ] | DB-P6.1.4 | notifications and notification_preferences | | | |
| [ ] | DB-P6.1.5 | outbox_events | | | |

**P6 Database exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P7 — Hardening and controlled pilot

### DB-P7.1 Operations

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | DB-P7.1.1 | Backup restore drill and timing recorded | | | |
| [ ] | DB-P7.1.2 | Slow-query review and index tuning | | | |
| [ ] | DB-P7.1.3 | Data retention and deletion policy implemented per legal advice | | | |
| [ ] | DB-P7.1.4 | Role separation: migration role, app role, read-only analytics role | | | |

**P7 Database exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

## P8 — Post-pilot: Hindi/Bengali and international

### DB-P8.1 Expansion

| Done | ID | Step | Verified by (test/PR) | Date | Notes |
|---|---|---|---|---|---|
| [ ] | DB-P8.1.1 | Country and locale reference tables | | | |
| [ ] | DB-P8.1.2 | Multi-currency fields verified | | | |
| [ ] | DB-P8.1.3 | Partitioning plan for chat and audit tables | | | |

**P8 Database exit check:** [ ] all steps verified · [ ] docs updated · [ ] handoff written

---

# Phase gates

## Gate P0 — Foundations, compliance setup and tooling
- [ ] Exit criteria met: CI green on empty app; O-1..O-4 decided; legal reviewer engaged
- [ ] Test checklist section for this phase fully ticked
- [ ] Rollback plan reviewed for this phase's migrations/deploys
- [ ] Demo recorded or written up

## Gate P1 — Identity and doctor onboarding
- [ ] Exit criteria met: Doctor can apply, be verified by admin, and log in with MFA; patient can register
- [ ] Test checklist section for this phase fully ticked
- [ ] Rollback plan reviewed for this phase's migrations/deploys
- [ ] Demo recorded or written up

## Gate P2 — Discovery and scheduled booking
- [ ] Exit criteria met: Patient can book a held slot; double-booking impossible under concurrency test
- [ ] Test checklist section for this phase fully ticked
- [ ] Rollback plan reviewed for this phase's migrations/deploys
- [ ] Demo recorded or written up

## Gate P3 — Payments, commission and refunds
- [ ] Exit criteria met: Test-mode payment confirms booking only via webhook; refunds follow policy; ledger balances
- [ ] Test checklist section for this phase fully ticked
- [ ] Rollback plan reviewed for this phase's migrations/deploys
- [ ] Demo recorded or written up

## Gate P4 — Telemedicine: video, audio, chat, instant
- [ ] Exit criteria met: Two real devices complete video, audio and chat consults; instant request works
- [ ] Test checklist section for this phase fully ticked
- [ ] Rollback plan reviewed for this phase's migrations/deploys
- [ ] Demo recorded or written up

## Gate P5 — Records, prescriptions and notifications
- [ ] Exit criteria met: Doctor issues prescription; patient views; every record read is audited
- [ ] Test checklist section for this phase fully ticked
- [ ] Rollback plan reviewed for this phase's migrations/deploys
- [ ] Demo recorded or written up

## Gate P6 — Subscriptions, reviews, admin ops and AI assist
- [ ] Exit criteria met: Premium entitlements enforced; admin can resolve disputes; AI features togglable and approval-gated
- [ ] Test checklist section for this phase fully ticked
- [ ] Rollback plan reviewed for this phase's migrations/deploys
- [ ] Demo recorded or written up

## Gate P7 — Hardening and controlled pilot
- [ ] Exit criteria met: Security checklist passed; restore drill done; pilot go/no-go signed
- [ ] Test checklist section for this phase fully ticked
- [ ] Rollback plan reviewed for this phase's migrations/deploys
- [ ] Demo recorded or written up

## Gate P8 — Post-pilot: Hindi/Bengali and international
- [ ] Exit criteria met: Hindi/Bengali live; first non-India country passes legal gate
- [ ] Test checklist section for this phase fully ticked
- [ ] Rollback plan reviewed for this phase's migrations/deploys
- [ ] Demo recorded or written up
