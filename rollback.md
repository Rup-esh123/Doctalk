# DocTALK — Rollback Plans

> Know the way out **before** you need it. Every deploy and migration must have a rollback or a forward-fix entry here before it merges.
> Golden rules: (1) prefer **feature-flag off** over redeploy, (2) prefer **forward-fix** over destructive DB rollback, (3) never roll back a migration that dropped or rewrote clinical or payment data without a restore plan, (4) after any rollback, write a `handoff.md` entry and a `decisions.md` note.

## 0. Decision tree

```
Problem in production?
 ├─ Is it a risky feature (instant, AI, subscriptions, intl)?  → turn its flag OFF (seconds)
 ├─ Is it a bad frontend deploy?                               → redeploy previous web build (minutes)
 ├─ Is it a bad API deploy with no schema change?              → redeploy previous API image (minutes)
 ├─ Is it a bad API deploy WITH a migration?                   → see Database §3 (expand/contract)
 ├─ Is money or PHI at risk?                                   → Incident procedure §4 first, then fix
 └─ Is the provider (payment/video/email) down?                → Provider outage §5
```

Severity: **SEV1** data exposure / wrong charges / consults failing for all · **SEV2** major feature down · **SEV3** degraded/minor.

---

# 1. Frontend

| Situation | Rollback action | Time | Verify |
|---|---|---|---|
| Bad web deploy | Promote previous build (Vercel "Instant Rollback" or redeploy prior Docker tag) | < 5 min | Smoke: login, search, booking page, consult page load |
| Broken PWA / stale service worker | Ship a new service worker that clears caches; bump cache version; keep kill-switch route `/sw-reset` | < 30 min | Installed PWA refreshes; no PHI cached |
| Bad env var / API URL | Revert env in hosting dashboard, redeploy | < 5 min | Network tab calls correct API |
| Broken locale / i18n key | Fall back to `en` (default locale is always bundled) | < 5 min | Pages render English |
| Bad CSP breaking flows | Switch CSP back to report-only via header config | < 10 min | Checkout and video load |
| Provider SDK upgrade breaks room | Pin previous SDK version, redeploy | < 15 min | Two-device call test |

**Preparation:** tag every release `web-vX.Y.Z`; keep last 5 builds; maintain smoke script; flags readable from API so UI hides disabled features without redeploy.

---

# 2. Backend

| Situation | Rollback action | Time | Verify |
|---|---|---|---|
| Bad API release (no migration) | Redeploy previous image tag `api-vX.Y.Z` | < 10 min | `/health/ready`, auth test, booking test |
| Risky feature misbehaving | Flip flag: `INSTANT_CONSULT`, `AI_INTAKE`, `AI_SUMMARY`, `SUBSCRIPTIONS`, `INTL` | seconds | Endpoint returns disabled response; UI hides entry |
| Payment webhook handler bug | Disable processing (leave events stored as `RECEIVED`), fix, then **replay** stored events via `webhook-retry` | < 30 min | Replayed events produce exactly one state change each; reconcile job clean |
| Wrong commission/refund logic shipped | Pause automatic refunds/settlement generation; fix; recompute affected ledger rows via **correcting entries** (never edit) | hours | Ledger debits = credits; affected patients/doctors list reviewed |
| Queue/worker runaway | Pause BullMQ queue, scale worker to 0, inspect, drain/retry | < 10 min | Queue depth stable |
| Secret/key leaked | Rotate key at provider, update secret store, redeploy, revoke old tokens (see §4) | < 30 min | Old key fails; new works |
| Video provider token bug | Roll back adapter; fall back to chat-only mode flag | < 15 min | Chat consult succeeds |
| Bad dependency | Revert lockfile, redeploy | < 15 min | CI + smoke green |

**Preparation:** immutable image tags; deploy via CI with one-click redeploy of previous tag; flags stored in config table/env readable at runtime; webhook events stored raw so they can be replayed; every job idempotent.

---

# 3. Database

## 3.1 Policy: expand → migrate → contract
1. **Expand:** add new columns/tables/indexes (nullable or defaulted). Deploy app that writes both old and new. *Rollback = redeploy previous app; schema is harmless.*
2. **Migrate/backfill:** batch scripts, resumable, logged.
3. **Contract:** drop old columns **at least one release later**, only after verification and a fresh backup. *This step is the only non-reversible one.*

## 3.2 Per-migration entry (fill before merge)
```
Migration: <timestamp_name>
Touches: tables/columns
Reversible?: yes / forward-fix only
Down plan: <SQL or "restore backup X">
Backup taken before: yes (id/time)
Locking risk: <long locks? use CONCURRENTLY?>
Verification query: <SQL proving success>
Owner / date:
```

## 3.3 Situations

| Situation | Action | Notes |
|---|---|---|
| Migration fails midway | Prisma/SQL runs in a transaction where possible; if partial, apply manual fix script, mark migration resolved | Never `migrate reset` on staging/prod |
| New index locks table | Use `CREATE INDEX CONCURRENTLY`; if started, cancel the query | Run off-peak |
| Bad backfill | Stop job; restore affected columns from the backup/temp table copy made before backfill | Always `CREATE TABLE x_backup AS ...` first |
| Wrong data written (logic bug) | Identify via audit logs + timestamps; write corrective update script; peer-review; run in transaction | Record in audit |
| Accidental deletion/corruption | **Point-in-time recovery** to a *new* instance, extract rows, re-insert; do not overwrite prod blindly | Time-box; announce downtime if needed |
| Total DB loss | Restore latest backup to new instance, repoint API (`DATABASE_URL`), replay stored webhook events, run reconcile | RPO/RTO targets below |
| Exclusion constraint blocks legitimate data | Fix data, not the constraint; the constraint is a safety net | Review via `EXPLAIN` |
| Encryption key lost | **Unrecoverable for encrypted fields** → keys stored in secret manager with a sealed offline copy; test key restore yearly | Highest-severity prevention item |

**Targets (placeholder, pilot):** RPO ≤ 24 h (improve with PITR) · RTO ≤ 4 h. Monthly restore drill must prove these.

**Never**: rewrite or delete `ledger_entries`, `audit_logs`, `encounters`, `prescriptions` in a rollback. Use correcting rows and new versions.

---

# 4. Incident procedure (security / PHI / money)

1. **Contain** — disable the affected feature flag or endpoint; revoke sessions/tokens; rotate exposed secrets.
2. **Preserve** — snapshot logs and DB state; do not wipe evidence.
3. **Assess** — what data, which users, what time window (use `audit_logs`, access logs).
4. **Notify** — owner immediately; legal counsel; affected users and authorities as required by applicable law and timelines (get advice; do not guess).
5. **Fix** — patch, test, deploy via CI.
6. **Review** — blameless write-up, add test that would have caught it, update `decisions.md` and `test-checklists.md`.

Contact sheet (fill in): owner · legal counsel · hosting support · payment gateway support · video provider support · DPO/grievance contact.

---

# 5. Provider outage playbook

| Provider | Impact | Degrade gracefully | Recover |
|---|---|---|---|
| Payment gateway | Cannot take payments | Show "payments unavailable"; disable booking button via flag; keep holds short | Re-enable; run reconcile; review stuck `HELD` rows |
| Video provider | Calls fail | Banner + switch to audio/chat; extend appointment window; offer free reschedule/refund per policy | Resume; audit affected sessions |
| Email provider | No notifications | Queue retries; in-app notices | Drain queue; check duplicates |
| Object storage | No uploads/downloads | Disable upload UI; prescriptions regenerate on demand | Re-scan pending files |
| Redis | Presence/queues down | Disable instant via flag; reminders delayed; scheduled booking still works from DB | Restore; re-enqueue from DB state |
| AI provider | No drafts | Flag off; clinician writes manually | Re-enable |
| Hosting region | Total outage | Status message; restore in alternate region from backups | Post-incident review |

---

# 6. Phase-level rollback readiness (tick before closing each gate)

| Phase | Must be ready |
|---|---|
| P0 | Tagging scheme, previous-image redeploy tested once |
| P1 | Auth deploy rollback tested; session revocation script exists |
| P2 | Booking migration has down plan; hold-expiry job safe to pause |
| P3 | Webhook replay tool tested; refund pause switch; ledger correction procedure |
| P4 | Flags for instant; chat-only fallback; provider adapter swap rehearsed |
| P5 | Encryption key backup verified; no destructive migrations on clinical tables |
| P6 | Subscription downgrade-safe; AI kill-switch tested |
| P7 | Full restore drill + incident tabletop exercise completed |
| P8 | Per-country flag; locale fallback to English |

# 7. Rollback log (append entries)

| Date | What was rolled back | Why | How | Data impact | Follow-up |
|---|---|---|---|---|---|
| — | — | — | — | — | — |
