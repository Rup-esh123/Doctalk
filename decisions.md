# DocTALK — Decision Log

> Records the **why**, not just the what. One entry per decision. Never delete entries; supersede them.
> **Source key:** `OWNER` = chosen by the product owner in chat · `AI-REC` = my recommendation, not yet confirmed · `AI-DEFAULT` = provisional default for an unanswered question.
> **Status:** Accepted · Provisional · Open · Superseded.

### Entry template
```
## D-### Title
Date · Source · Status · Layer(s): FE/BE/DB
Context: what problem forced a choice
Decision: what we chose
Why: reasons, tied to constraints (budget, safety, team size)
Alternatives rejected: and why
Consequences / risks: what this makes harder
Revisit when: trigger to reconsider
```

---

# Part A — Product decisions (from the planning chat)

## D-001 Web app + mobile-ready PWA, not native
2026-10-27 · OWNER · Accepted · FE
**Context:** Needs phone access on a student budget. **Decision:** Responsive web with PWA install. **Why:** One codebase, no app-store fees or review delays, WebRTC works in mobile browsers. **Rejected:** Native apps first (2× cost, slower iteration). **Consequences:** Limited background push on some iOS versions; email reminders cover the gap. **Revisit when:** retention data shows push notifications are critical.

## D-002 India first, international later
OWNER · Accepted · FE/BE/DB
**Why:** Regulatory scope is manageable one country at a time; chat explicitly warned a doctor being visible globally does not mean they may treat globally. **Consequences:** Store `country`, time zone, currency from day one (cheap now, costly to retrofit); no cross-border consults in v1. **Revisit when:** pilot stable and counsel clears a second country (P8).

## D-003 Consultation modes: video + audio + secure chat
OWNER · Accepted · FE/BE
**Why:** Audio and chat are lifelines on weak networks, and a fallback when video fails. **Consequences:** Three UI modes, per-mode provider config, mode stored on `appointments`.

## D-004 Production-ready bar on a student budget
OWNER · Accepted · all
**Why:** Healthcare data and money are involved; a demo-grade build would be unsafe. **Consequences:** Security, tests, audit, backups are *in scope for every phase*, which lengthens the timeline; cost controlled by managed free tiers + one monolith.

## D-005 Hybrid model: marketplace + managed clinic
OWNER · Accepted · BE/DB
**Why:** Marketplace gives supply breadth; managed clinic gives quality control. **Consequences:** `practice_type` on doctors; separate commission agreements; legal roles differ per type (needs counsel). **Risk:** two sets of support and refund responsibilities.

## D-006 Doctor onboarding: applications + invitations, both verified
OWNER · Accepted · FE/BE/DB
**Why:** Invitations seed quality supply; applications scale. Neither bypasses verification. **Consequences:** Invite-token flow, shared verification pipeline, credential expiry jobs.

## D-007 Tiered commission
OWNER · Accepted · BE/DB
**Why:** Managed doctors use more platform resources than independents. **Decision details:** commission in basis points on a **versioned doctor agreement**, snapshotted onto each appointment. **Why snapshot:** later changes must not rewrite history. Example 15%/25% in chat is illustrative only. **Open:** actual percentages.

## D-008 Doctor subscriptions at launch (Free + Premium)
OWNER · Accepted · BE/DB/FE
**Why (owner):** second revenue stream. **My caution recorded:** AI-REC had advised deferring until value is proven; owner chose launch. **Mitigation:** two plans only, entitlements stored in our DB, and Premium must never restrict patient access to care. **Revisit when:** conversion data is available.

## D-009 AI is assistive only
OWNER (assist) · Accepted · BE/FE
**Why:** Clinical safety and privacy; AI must not diagnose or prescribe. **Consequences:** Feature flags, redaction, budget cap, `ai_interactions` log, clinician approval gate. Scope detail pending (O-3).

## D-010 Booking: scheduled + instant, scheduled ships first
OWNER (both) · Accepted · BE/FE/DB
**Why:** Instant needs enough online doctors to be honest to patients. **Consequences:** Instant is behind flag `INSTANT_CONSULT`, built in P4 after the scheduled path is proven. Patient is never charged without an accepted doctor.

## D-011 Doctors set own fees (independent); managed pricing set by DocTALK
OWNER · Accepted · BE/DB
**Why:** Marketplace autonomy. **Consequence:** fee snapshot on appointment so profile edits do not change booked prices; fee disclosure before payment.

## D-012 Clinic-managed medical records
OWNER · Accepted · BE/DB
**Why:** Continuity of care. **Caution recorded:** patients and treating clinicians must retain lawful access, correction and retention rules; independent doctors' responsibilities need definition. **Consequences:** care-relationship model + audited access; clinical tables isolated from analytics. **Pending:** O-4.

## D-013 English at launch, i18n-ready
OWNER · Accepted · FE
**Why:** Lower QA/support load; `next-intl` from day one makes Hindi/Bengali content-only work later.

## D-014 Prepay before confirmation
OWNER · Accepted · BE/FE
**Why:** Reduces no-shows and unpaid consults. **Consequences:** `HELD` state with expiring holds; webhook-driven confirmation.

## D-015 Defined cancellation/refund policy
OWNER · Accepted · BE/DB/FE
**Why:** Transparency and fewer disputes. **Consequences:** `policies` module versioned; `cancel_policy_version` snapshot; refund preview in UI. **Open:** the numeric windows (placeholders in architecture 5.4).

---

# Part B — Open decisions (Stage 5, never answered)

## D-016 Doctor verification depth — **Open (O-1)**
AI-DEFAULT: manual admin approval + automated expiry reminders. **Why default:** automation cannot replace authoritative registry checks; reminders catch lapses cheaply. **Needs:** owner confirmation and counsel input on which council registries to check.

## D-017 Emergency handling — **Open (O-2)**
AI-DEFAULT: conservative emergency guidance and redirect to emergency services; no AI-only triage. **Why:** an automated safety call could delay emergency care. **Consequences:** persistent banner, pre-instant screen, escalation process documented.

## D-018 AI scope — **Open (O-3)**
AI-DEFAULT: admin help + structured intake + clinician-approved summaries, each behind its own flag. **Why:** lets us ship AI value incrementally and kill any piece instantly.

## D-019 Record access — **Open (O-4)**
AI-DEFAULT: access only via explicit care relationship or patient-granted access, break-glass audited. **Why:** strictest option is easiest to relax later than to tighten after a leak.

---

# Part C — Technical decisions (AI-REC unless noted)

## D-020 Modular monolith, not microservices
Accepted-provisional · BE. **Why:** one deployable, one DB transaction scope (booking + payment), lowest ops cost for a student team. **Rejected:** microservices (distributed-transaction and ops burden). **Revisit when:** a module needs independent scaling or a team boundary appears.

## D-021 TypeScript everywhere with shared zod schemas
FE/BE. **Why:** one language, validation defined once in `packages/shared`, fewer FE/BE drift bugs.

## D-022 Next.js (App Router) + Tailwind + shadcn/ui
FE. **Why:** SSR for doctor SEO, accessible primitives, fast UI. **Rejected:** plain SPA (weaker SEO), heavy UI kits (bundle weight).

## D-023 NestJS REST API (not Next.js API routes only)
BE. **Why:** guards/interceptors/DI suit RBAC, audit, and WebSocket gateway; separate API can serve a future mobile app. **Rejected:** Next.js API routes as the only backend (business logic tangled into the web app).

## D-024 PostgreSQL + Prisma
DB. **Why:** transactions and the **GiST exclusion constraint** make double-booking impossible at the database level, not just in code. Raw SQL migrations used where Prisma lacks support. **Rejected:** MongoDB (weaker constraints for money/booking).

## D-025 Money as integer paise, UTC timestamps, IANA time zones
DB/FE/BE. **Why:** avoids float rounding and DST/timezone bugs; critical for future internationalisation.

## D-026 Webhook is the source of truth for payment
BE. **Why:** browser success screens can be faked or never fire. Idempotent `webhook_events` table plus nightly reconcile covers duplicates and misses.

## D-027 Append-only ledger
DB/BE. **Why:** "where did the money go" must always be answerable; corrections are new entries, never edits.

## D-028 Razorpay first; payouts manual for pilot
BE. **Why:** India-first gateway, hosted checkout (no card data on our servers). Marketplace split (Route) needs extra approvals/KYC, so pilot uses ledger + CSV settlements. **Revisit when:** monthly payouts become burdensome. **Verify:** Razorpay capabilities and fees at integration time.

## D-029 Video behind a `VideoProvider` adapter; vendor chosen by P4 spike
BE/FE. **Why:** never build WebRTC infrastructure; adapter prevents lock-in. Candidates: LiveKit (open-source, self-hostable) and 100ms (India-based). Selection criteria: free allowance, India/Asia regions, SDK quality, token security, mobile browser reliability. **Status:** Provisional until the spike.

## D-030 Chat on our own Socket.IO gateway
BE. **Why:** cheapest, and message authorization/persistence stays under our control. **Rejected:** third-party chat SaaS (cost, data location).

## D-031 Own JWT auth with rotating refresh + MFA (not Auth.js)
BE. **Why:** with a separate NestJS API, one authority issuing and validating tokens is simpler and safer than syncing two systems. Doctors/admins require MFA. **Revisit when:** social/OTP logins demand a managed IdP.

## D-032 No consultation recording by default
BE. **Why:** privacy, storage cost, consent complexity. Chat explicitly advised this.

## D-033 Private object storage + signed short-lived URLs + malware scan
BE. **Why:** medical documents must never be publicly addressable.

## D-034 Field-level encryption for clinical text
DB. **Why:** limits blast radius of DB leaks/backups. **Cost:** cannot search encrypted fields; search uses non-clinical fields only.

## D-035 Feature flags for risky/late features
FE/BE. Flags: `INSTANT_CONSULT`, `AI_INTAKE`, `AI_SUMMARY`, `SUBSCRIPTIONS`, `INTL`. **Why:** ship dark, enable per environment, instant rollback.

## D-036 Outbox pattern for notifications/events
BE/DB. **Why:** guarantees an event is published iff the transaction committed.

## D-037 Email first; SMS/WhatsApp deferred
BE. **Why:** per-message cost; chat recommended deferring until justified.

## D-038 pnpm + Turborepo monorepo
All. **Why:** shared types and one CI. **Rejected:** separate repos (type drift).

## D-039 Docs live in-repo and are updated per PR
All. **Why:** `architecture.md`, `flow.md`, `progress.md`, `handoff.md` only help if they stay current.

---

# Part D — Interpretation notes (things I assumed while writing these docs)

| # | Note |
|---|---|
| N-1 | The request mentioned a "demo bank website" and "FAIR". Neither appears in the DocTALK chat, so nothing was invented. Add content if intended. |
| N-2 | The request said "three files" but listed eight; all eight were produced. |
| N-3 | Stage 5 questions were never answered; AI-DEFAULT values are used and flagged. |
| N-4 | All numbers (commission %, refund windows, effort weeks, performance targets) are placeholders for owner approval. |
| N-5 | Third-party pricing/limits were not verified; the cost register in `architecture.md` section 16 must be filled from live vendor pages. |
| N-6 | Legal statements are design assumptions, not legal advice. |
