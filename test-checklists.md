# DocTALK — Test Checklists

> Principle: **proof, not claims.** A box is ticked only when you can point to a test name, PR, screenshot, log line or recorded run. Put that evidence in the "Evidence" column or the PR description.
> Tick these in step with `progress.md`; a phase gate cannot close with unticked items for that phase.
> Tooling (planned): Vitest/Jest, Supertest, Testcontainers (real Postgres/Redis), Playwright, axe, k6 or Artillery for load.

**Evidence format:** `test:<file>::<name>` · `PR #n` · `run:<CI url>` · `manual:<date, device, who>`

---

# 1. Frontend

## 1.1 Every phase (baseline)
| ☐ | Check | Evidence |
|---|---|---|
| ☐ | `pnpm lint`, `typecheck`, `build` pass in CI | |
| ☐ | No hard-coded user-facing strings (i18n lint passes) | |
| ☐ | axe automated scan: zero serious/critical issues on touched pages | |
| ☐ | No secrets or provider keys in the built bundle (grep `.next` output) | |
| ☐ | No PHI in `localStorage`, `sessionStorage`, URLs or service-worker cache | |
| ☐ | Loading, empty and error states exist for each new view | |

## 1.2 Auth and onboarding (P1)
| ☐ | Check | Evidence |
|---|---|---|
| ☐ | Registration validation errors are shown inline, never raw API errors | |
| ☐ | Login, MFA, reset flows work with keyboard only | |
| ☐ | Expired session triggers silent refresh, then login redirect | |
| ☐ | Role redirect works; patient cannot reach `/doctor` or `/admin` (UI), and API still denies it | |
| ☐ | Doctor wizard resumes where it stopped after refresh | |
| ☐ | Upload rejects wrong type/size; shows progress and failure retry | |

## 1.3 Search and booking (P2–P3)
| ☐ | Check | Evidence |
|---|---|---|
| ☐ | Slots display correctly for a patient in a different time zone than the doctor (test IST vs UTC vs PST) | |
| ☐ | Fee, platform charge and cancellation policy visible **before** pay button | |
| ☐ | Clicking pay twice never creates two bookings | |
| ☐ | Closing Checkout mid-payment leaves a pending state that resolves via polling | |
| ☐ | Slot-taken error refreshes slots and explains clearly | |
| ☐ | Cancel dialog shows the same refund amount the server later issues | |
| ☐ | Search keyboard/screen-reader operable; filters persist in URL | |

## 1.4 Consultation (P4)
| ☐ | Check | Evidence |
|---|---|---|
| ☐ | Device check detects: no camera, denied permission, no mic, and gives instructions | |
| ☐ | Two real devices complete video call, audio-only call, chat-only consult | |
| ☐ | Network drop 10s → auto reconnect; 60s → clear state message | |
| ☐ | Poor network → suggests audio-only fallback | |
| ☐ | Tested on Chrome Android, Safari iOS, desktop Chrome/Firefox/Edge | |
| ☐ | Leaving the page ends/pauses media tracks (no camera light left on) | |
| ☐ | Emergency banner visible in booking, instant, waiting room | |

## 1.5 Clinical and admin (P5–P6)
| ☐ | Check | Evidence |
|---|---|---|
| ☐ | Encounter autosave survives refresh and offline blip without data loss | |
| ☐ | Prescription preview matches issued PDF | |
| ☐ | AI-drafted content is visibly labelled and cannot be saved without approve action | |
| ☐ | Admin screens unreachable by non-admin even with a crafted URL | |
| ☐ | Premium-only UI shows upgrade prompt, and API refuses the action regardless | |

## 1.6 Hardening (P7)
| ☐ | Check | Evidence |
|---|---|---|
| ☐ | CSP report-only → enforced with no violations on key flows | |
| ☐ | Lighthouse: performance/accessibility/best-practices meet agreed budget | |
| ☐ | Real-device test on low-end Android over throttled 3G/4G | |
| ☐ | WCAG 2.1 AA manual audit with screen reader | |

---

# 2. Backend

## 2.1 Every phase (baseline)
| ☐ | Check | Evidence |
|---|---|---|
| ☐ | Unit + integration tests pass in CI against real Postgres/Redis (Testcontainers) | |
| ☐ | Every new endpoint has: auth test, wrong-role test, wrong-owner test, validation-failure test | |
| ☐ | Error responses follow `{code,message,requestId}` and leak no stack traces | |
| ☐ | Logs contain no PHI, tokens, or secrets (log scrubber test) | |
| ☐ | New env vars added to schema + `.env.example` | |

## 2.2 Auth (P1)
| ☐ | Check | Evidence |
|---|---|---|
| ☐ | Passwords hashed with Argon2id; plaintext never logged | |
| ☐ | Brute force → lockout/throttle after N attempts | |
| ☐ | Refresh token reuse revokes entire token family | |
| ☐ | MFA required for doctor/admin; cannot be skipped by calling API directly | |
| ☐ | Unverified doctor cannot appear in search or be booked | |
| ☐ | Expired credential removes doctor from search within one job cycle | |
| ☐ | Admin actions create audit rows | |

## 2.3 Booking and payments (P2–P3)
| ☐ | Check | Evidence |
|---|---|---|
| ☐ | **Concurrency:** 50 parallel bookings for one slot → exactly 1 succeeds | |
| ☐ | Unpaid hold expires and slot returns to availability | |
| ☐ | Appointment is `CONFIRMED` **only** after a valid signed webhook | |
| ☐ | Forged/invalid webhook signature rejected and logged | |
| ☐ | Same webhook delivered 5× → one state change, one ledger set | |
| ☐ | Webhook after hold expiry → auto-refund path, no orphan charge | |
| ☐ | Webhook never arrives → reconcile job recovers state | |
| ☐ | Commission uses the agreement snapshot; changing the agreement later does not alter old appointments | |
| ☐ | Ledger balances: for any appointment, debits = credits | |
| ☐ | Refund policy table-driven tests cover every actor × timing row in architecture 5.4 | |
| ☐ | Duplicate refund request → one refund only | |
| ☐ | Refund total can never exceed amount paid (DB check + service) | |
| ☐ | Razorpay test mode: success, failure, refund, partial refund captured as evidence | |

## 2.4 Consultation (P4)
| ☐ | Check | Evidence |
|---|---|---|
| ☐ | Join token refused outside join window and for non-participants | |
| ☐ | Token TTL short; expired token unusable | |
| ☐ | Provider secret never present in any API response | |
| ☐ | Chat: user not in appointment cannot connect to room or read history | |
| ☐ | Chat messages persisted; reconnect delivers missed messages | |
| ☐ | No-show sweeper applies correct status and refund per policy | |
| ☐ | Instant: two doctors accept simultaneously → one winner | |
| ☐ | Instant: patient never charged when no doctor accepts | |
| ☐ | Provider outage simulated → graceful error, alert fired | |

## 2.5 Records, files, AI (P5–P6)
| ☐ | Check | Evidence |
|---|---|---|
| ☐ | Doctor without care relationship/grant → 403 on record read | |
| ☐ | Every record read/write creates an audit row | |
| ☐ | Break-glass requires reason, alerts admin | |
| ☐ | Issued prescription immutable; amendment creates new version | |
| ☐ | Signed URLs expire (≤5 min) and cannot be reused after | |
| ☐ | Disallowed MIME/oversized/malware file rejected | |
| ☐ | Emails contain no clinical details | |
| ☐ | AI: flag off → endpoints unavailable; budget cap enforced; identifiers redacted before provider call (assert on outbound payload) | |
| ☐ | AI output never lands in `encounters` without clinician approval | |

## 2.6 Hardening (P7)
| ☐ | Check | Evidence |
|---|---|---|
| ☐ | OWASP ASVS L2 subset walkthrough done; findings tracked | |
| ☐ | IDOR tests: swap IDs across users for every resource endpoint | |
| ☐ | Rate limits verified on auth, search, booking, OTP | |
| ☐ | Load test meets targets in architecture section 14 | |
| ☐ | Chaos: Redis down, provider down, DB failover — system degrades safely | |
| ☐ | Dependency and secret scans clean or risk-accepted | |

---

# 3. Database

## 3.1 Every migration
| ☐ | Check | Evidence |
|---|---|---|
| ☐ | Migration applies on empty DB **and** on a copy of staging data | |
| ☐ | Migration is backward-compatible with the currently deployed app version | |
| ☐ | Rollback/forward-fix note added in `rollback.md` | |
| ☐ | Indexes reviewed with `EXPLAIN` for new frequent queries | |
| ☐ | No PHI in seed data; seed contains fake data only | |

## 3.2 Constraint proofs
| ☐ | Check | Evidence |
|---|---|---|
| ☐ | Overlapping active appointments for one doctor rejected by the exclusion constraint (direct SQL insert test) | |
| ☐ | Cancelled/expired appointment does not block the slot | |
| ☐ | `webhook_events (provider,event_id)` duplicate rejected | |
| ☐ | `payments.provider_order_id`, `refunds.provider_refund_id` unique | |
| ☐ | Negative amounts rejected | |
| ☐ | One review per appointment; review only after completed + paid | |
| ☐ | `audit_logs` UPDATE/DELETE fails for the app role | |
| ☐ | FK deletes cannot orphan clinical/payment rows | |

## 3.3 Operations
| ☐ | Check | Evidence |
|---|---|---|
| ☐ | Automated backup visible in provider console | |
| ☐ | **Restore drill:** restore latest backup to a scratch DB; record time and row counts | |
| ☐ | Point-in-time recovery tested (if offered) | |
| ☐ | App, migration, and read-only roles have separate least-privilege grants | |
| ☐ | Encrypted columns unreadable without the key (verify via raw SQL) | |
| ☐ | Analytics views expose no clinical fields | |
| ☐ | Slow query log reviewed; top 5 queries tuned | |
| ☐ | Disk/connection usage alerts configured | |

---

# 4. Cross-layer scenarios (end-to-end acceptance)

| ☐ | Scenario | Evidence |
|---|---|---|
| ☐ | **E2E-1** New doctor applies → admin verifies → profile appears in search | |
| ☐ | **E2E-2** Patient books, pays (test mode), receives confirmation email | |
| ☐ | **E2E-3** Patient abandons payment → hold expires → slot reopens | |
| ☐ | **E2E-4** Consultation over video; doctor ends; prescription issued; patient downloads | |
| ☐ | **E2E-5** Patient cancels 30h before → 100% refund; ledger correct | |
| ☐ | **E2E-6** Doctor no-show → refund + doctor flagged | |
| ☐ | **E2E-7** Instant request accepted, paid, consult completed | |
| ☐ | **E2E-8** Instant request unanswered → patient not charged, offered scheduling | |
| ☐ | **E2E-9** Doctor credential expires → hidden from search, existing appointments flagged | |
| ☐ | **E2E-10** Unauthorized doctor attempts patient record read → denied + audited | |
| ☐ | **E2E-11** Provider outage during consult → fallback to chat, alert, refund path available | |
| ☐ | **E2E-12** Premium downgrade removes premium features without breaking existing bookings | |

# 5. Pilot go/no-go checklist (P7 gate)

| ☐ | Item |
|---|---|
| ☐ | Healthcare-law review completed; findings addressed or accepted in writing |
| ☐ | Privacy policy, terms, consent texts published and versioned |
| ☐ | Emergency guidance reviewed by a clinician |
| ☐ | All E2E scenarios above passed on staging |
| ☐ | Restore drill passed within the last 30 days |
| ☐ | Alerts route to a person who will actually see them |
| ☐ | Rollback plan rehearsed once |
| ☐ | Support contact and incident process documented |
| ☐ | Live payment keys tested with a small real transaction and refund |
| ☐ | Pilot limited to named doctors and patients with explicit consent |
