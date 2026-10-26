# DocTALK — Execution Flow

> **Status: design-time trace.** No code exists yet. File paths and function names below are the *intended contract* from `architecture.md` section 3. When code is written, update this file in the same PR; if a name changes, change it here.
> Notation: `file → function()` means "calls". `[DB]` marks a database touch, `[EXT]` an external provider, `[Q]` a queued job, `[WS]` a WebSocket event.

---

## How to read this file

Each flow has three traces: **Frontend**, **Backend**, **Database**, followed by failure paths. Paths are relative to `apps/web/src` (FE) and `apps/api/src` (BE).

---

## F1. Login with MFA

**Frontend**
1. `app/(auth)/login/page.tsx` → `LoginForm.onSubmit()` validates with `packages/shared/schemas/auth.ts → loginSchema`
2. `lib/api-client.ts → auth.login()` → `POST /v1/auth/login`
3. If response `mfaRequired` → redirect `app/(auth)/mfa/page.tsx` → `auth.verifyMfa()`
4. On success cookies set by server; `hooks/useSession.ts` refetches `/v1/me`; `middleware.ts` routes by role

**Backend**
1. `modules/auth/auth.controller.ts → login()` ← throttler guard
2. `auth.service.ts → validateCredentials()` → `users.repo → findByEmail()` [DB]; Argon2id verify
3. Lockout check → `auth.service.ts → recordFailure()` [DB/Redis]
4. If role needs MFA → issue short `mfa_pending` token, return `mfaRequired`
5. `auth.service.ts → verifyMfa()` TOTP check → `issueTokens()` → access JWT + refresh row (`refresh_tokens`) [DB] → set httpOnly cookies
6. `audit.service → log('auth.login')` [DB]

**Database:** read `users`; write `refresh_tokens`, `audit_logs`.
**Failure paths:** wrong password → generic error + counter; refresh reuse detected → revoke whole `family_id`; MFA brute force → throttle.

---

## F2. Doctor onboarding and verification

**Frontend:** `(doctor)/onboarding/page.tsx` wizard → profile step → `components/files/Uploader.tsx` requests signed URL (`POST /v1/files/upload-url`) → direct PUT to storage → `POST /v1/doctors/me/credentials` → agreement step → status page polls `GET /v1/doctors/me`.

**Backend**
1. `doctors.controller → upsertProfile()` → `doctors.service` [DB `doctor_profiles`]
2. `files.controller → createUploadUrl()` → `providers/storage → signedPut()` [EXT]; row in `files` (`scan_status=PENDING`)
3. `[Q] file-scan` marks `scan_status=CLEAN`
4. `credentials.controller → submit()` → status `SUBMITTED` [DB `doctor_credentials`]
5. Admin: `admin.controller → listVerificationQueue()` → `credentials.service → review(decision)` → on VERIFIED: `doctors.service → publish()`; schedule `[Q] credential-expiry` reminders; `audit.log('credential.verify')`
6. `agreements.service → accept()` snapshots `commission_bps` version

**Database:** `doctor_profiles`, `files`, `doctor_credentials`, `doctor_agreements`, `audit_logs`.
**Failure paths:** infected/invalid file → rejected, doctor notified; admin rejects → `REJECTED` + reason; credential expiry → `[Q]` sets `EXPIRED`, doctor hidden from search.

---

## F3. Scheduled booking → payment confirmation (the critical flow)

**Frontend**
1. `app/(public)/doctors/[slug]/page.tsx` → `components/doctor/SlotPicker.tsx → useSlots()` → `GET /v1/doctors/:id/slots`
2. `BookingPanel.onConfirm()` (shows `FeeBreakdown` + policy + consent) → `appointments.create()` with `Idempotency-Key` → `POST /v1/appointments`
3. Receives `{ appointmentId, razorpayOrderId, amount }` → `lib/razorpay.ts → openCheckout()`
4. Checkout handler only navigates to `/app/appointments/[id]?pending=1`; page polls `GET /v1/appointments/:id` until `CONFIRMED`

**Backend (create)**
1. `appointments.controller → create()` → JWT + role guard (PATIENT) → zod pipe
2. `appointments.service → book()` runs in **one DB transaction**:
   - `idempotency.check(key)`
   - `doctors.service → assertBookable()` (verified, agreement, entitlement)
   - `availability.service → assertSlotValid()`
   - snapshot: `fee_paise`, `commission_bps` (from `agreements`), `cancel_policy_version` (from `policies`)
   - `INSERT appointments status=HELD period=tstzrange` → **GiST exclusion rejects overlap** [DB]
   - `payments.service → createOrder()` → `providers/payment → createOrder()` [EXT]
   - insert `payments(status=CREATED)`
3. After commit: `[Q] hold-expiry` delayed job

**Backend (webhook)**
1. `payments/webhook.controller → razorpay()` — raw body preserved
2. `providers/payment → verifyWebhook(signature)`; invalid → 400, logged
3. `webhook_events.insert(provider,event_id)` — unique violation ⇒ already processed ⇒ return 200
4. `payments.service → onCaptured()` in transaction: payment `CAPTURED`; `appointments.service → transition(HELD→CONFIRMED)`; `ledger.service → record()` (gateway fee, commission, doctor payable); `outbox.insert('appointment.confirmed')`
5. `[Q] outbox-dispatch` → `notifications.service → sendConfirmation()` and schedules reminders

**Database:** `appointments`, `payments`, `webhook_events`, `ledger_entries`, `outbox_events`, `notifications`.
**Failure paths**
- Overlap → `409 SLOT_TAKEN`, UI refreshes slots.
- Payment failed/abandoned → `hold-expiry` sets `EXPIRED`, slot freed.
- Webhook arrives after hold expired → `onCaptured()` detects `EXPIRED` ⇒ auto-refund flow (F6) and notify.
- Webhook duplicate → no-op. Webhook never arrives → `payment-reconcile` job queries gateway and heals.

---

## F4. Instant consultation

**Frontend:** `(patient)/instant/page.tsx` → `EmergencyScreen` acknowledgement → `instant.request()` → `POST /v1/instant` → subscribe `[WS] instant:status` via `lib/socket.ts`. Doctor side: `(doctor)/instant` toggle → `usePresence()` heartbeat; `OfferModal` → `instant.accept()`.

**Backend**
1. `instant.controller → request()` → `instant.service → create()` [DB `instant_requests`]
2. `matching.service → findCandidates()` ← Redis presence set + DB filters (verified, accepts_instant, entitlement, not in session)
3. `[WS] instant:offer` to candidates
4. `instant.service → accept()` uses atomic update `WHERE status='OFFERED' AND accepted_by IS NULL`; winner creates `HELD` appointment starting now (reuses F3 `book()` internals) and payment order
5. `[WS] instant:accepted` to patient → Checkout → webhook confirms (F3 steps)
6. `[Q] instant-expiry` if unanswered → status `QUEUED/EXPIRED`, patient offered scheduling

**Failure paths:** two doctors accept simultaneously → one atomic update fails; doctor goes offline mid-offer → presence TTL expires; patient never charged unless a doctor accepted.

---

## F5. Joining and running a consultation

**Frontend**
1. `consult/[appointmentId]/page.tsx` → `DeviceCheck` → `consult.join()` → `POST /v1/consultations/:id/join`
2. `useConsultRoom()` connects provider SDK with returned token; also opens chat `[WS]`
3. `WaitingRoom` listens to `[WS] session:status`; on both present, renders `LiveRoom`
4. Doctor `End` → `consult.end()`; navigates to encounter editor (doctor) or summary (patient)

**Backend**
1. `consultations.controller → join()` → `policy.guard(isParticipant)`
2. `consultations.service → joinOrCreateSession()` checks window (`starts_at - 10m` ≤ now ≤ `ends_at + grace`), appointment in `CONFIRMED/READY/IN_PROGRESS`
3. `providers/video → createRoom()` (idempotent) / `issueToken(ttl≈15m)` [EXT]
4. Update `consultation_sessions` joined timestamps; first doctor join ⇒ `READY`, both ⇒ `IN_PROGRESS`; `[WS] session:status`
5. `chat.gateway → handleMessage()` verifies socket user ∈ appointment, persists `chat_messages` (encrypted body), broadcasts
6. `consultations.service → end()` → provider `endRoom()` → `COMPLETED`, `ended_at`; `outbox('consultation.completed')`
7. `[Q] no-show-sweeper`: no join after grace ⇒ `NO_SHOW_*` ⇒ refund policy (F6)

**Failure paths:** token expired → client calls join again; provider outage → status banner, fallback to chat, admin alert; patient disconnect → reconnect window then marked per policy.

---

## F6. Cancellation and refund

**Frontend:** `AppointmentDetail → CancelDialog` calls `GET /v1/appointments/:id/cancel-preview` (shows refund amount) → `POST /v1/appointments/:id/cancel`.

**Backend**
1. `appointments.service → cancel(actor)` transition → `CANCELLED_BY_PATIENT|DOCTOR`
2. `policies.service → evaluate(appointment, actor, now)` returns refund %
3. `refunds.service → create()` inside the same transaction; ledger reversal entries
4. `[Q] refund-execute` → `providers/payment → refund(idempotencyKey)` [EXT]
5. Refund webhook → `refunds.service → onProcessed()` updates status; email
6. Failed refund → status `FAILED` → admin queue

**Database:** `appointments`, `refunds`, `ledger_entries`, `audit_logs` (if admin override).

---

## F7. Encounter and prescription

**Frontend:** `(doctor)/patients/[id]/encounter` autosaves draft (`PATCH /v1/encounters/:id`), then `PrescriptionBuilder → POST /v1/prescriptions/:id/issue`.

**Backend**
1. `records.controller → saveEncounter()` → `policy.guard(hasCareRelationship OR grant)`
2. `records.service` encrypts fields; writes `encounters`; `audit.log('record.write')`
3. `prescriptions.service → issue()` → doctor verified & credential valid → render PDF → `files` (private) → status `ISSUED`; later changes create a new version, never overwrite
4. Patient `GET /v1/prescriptions/:id/download` → signed URL (≤5 min) + `audit.log('record.read')`

**Failure paths:** doctor credential expired mid-visit → issuing blocked, admin alert; unauthorized read → 403 + audit.

---

## F8. AI-assisted intake (behind flags)

1. FE `IntakeForm` → `POST /v1/ai/intake`
2. BE `ai.controller` checks flag `AI_INTAKE` and budget → `ai.service → redact()` removes identifiers → `providers/ai → complete()` [EXT] → store `ai_interactions(status=DRAFT)`
3. Doctor opens appointment → sees draft with disclosure → `approve()/reject()` → only approved text copied into `encounters`
4. Kill-switch: flag off ⇒ endpoints return 404, UI hides entry points

---

## F9. Background job map

| Job | File | Reads/writes |
|---|---|---|
| hold-expiry | `jobs/hold-expiry.processor.ts` | appointments |
| reminders | `jobs/reminders.processor.ts` | appointments, notifications |
| payment-reconcile | `jobs/payment-reconcile.processor.ts` | payments, ledger, gateway |
| credential-expiry | `jobs/credential-expiry.processor.ts` | doctor_credentials, doctor_profiles |
| no-show-sweeper | `jobs/no-show.processor.ts` | consultation_sessions, appointments, refunds |
| outbox-dispatch | `jobs/outbox.processor.ts` | outbox_events, notifications |
| webhook-retry | `jobs/webhook-retry.processor.ts` | webhook_events |

---

## F10. Request lifecycle (every API call)

`Client → CDN/WAF → NestJS → RequestId middleware → Throttler → JwtGuard → RolesGuard → PolicyGuard → ZodValidationPipe → Controller → Service (transaction) → Repository → Postgres → AuditInterceptor → ResponseSerializer → Client`; errors pass through `HttpExceptionFilter` → `{code,message,requestId}`; Sentry gets 5xx with PHI scrubbed.
