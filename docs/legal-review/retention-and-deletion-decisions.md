# Retention and Deletion — Decisions Needed

These are unresolved business decisions, not legal requirements this
document is inventing. **No retention period below is recommended as if it
were legally required** — each is simply listed as a decision the founder
needs to make, ideally with input from the legal/privacy reviewer.

No retention or deletion system has been built. This document does not
describe existing behaviour beyond what's noted as "current state."

## 1. Account data retention
**Current state:** account data is retained indefinitely; nothing expires
it automatically.
**Decision needed from founder:** how long should account data be kept
after an account is last used? Indefinitely, or after a defined period of
inactivity?

## 2. What happens after account deletion
**Current state (from 30 Sep 2026):** Account settings → Delete your account
(password and typed "DELETE" required) immediately and permanently removes
every uploaded file, every database row the user owns and the login itself.
There is no grace period and no copy kept by the app. Supabase's own
infrastructure backups are outside the app's control (see item 4). This
behaviour was built at the founder's request as the simplest option and is
still subject to the decision below.
**Decision needed from founder:** when a user deletes their account, should
everything (properties, evidence, attachments, items) be deleted
immediately, after a grace period, or retained for some purpose (e.g.
dispute resolution)?

## 3. Whether deleted attachments are permanently removed
**Current state:** deleting an evidence attachment through the app removes
both its Storage file and its database row (built and tested as part of
the Evidence Attachments feature).
**Decision needed from founder:** is app-level deletion sufficient, or does
the founder want confirmation of how quickly the underlying Supabase
infrastructure purges the file for good?

## 4. Backup-retention handling
**Current state:** unknown — this depends on Supabase's own infrastructure
backup policy, which Letnook's code does not control.
**Decision needed from founder:** obtain and document Supabase's backup
retention policy (from Supabase's own documentation/support), so the
Privacy Notice can state it accurately rather than guessing.

## 5. User access / export requests
**Current state:** no export feature exists.
**Decision needed from founder:** how will a user's request to see or
export their own data be handled — manually by the founder in the short
term, or via a built feature later?

## 6. Subject access requests / deletion requests
**Current state:** no formal process exists.
**Decision needed from founder:** who receives these requests, what's the
target response time, and is a manual process acceptable at this stage or
does it need to be built into the app?

## 7. Inactive accounts
**Current state:** an account that's never used again is kept forever,
with no automatic review or expiry.
**Decision needed from founder:** should there be any policy for accounts
that go inactive for a long period (e.g. a reminder email, or eventual
deletion)? None of this is built, and none is recommended here as a
default.

## 8. Guest stays (completed and cancelled)
**Current state:** a guest stay is kept until the host permanently deletes
it. Cancelling a stay clears the guest first name immediately but keeps
the dates, guest count and booking reference. The host can also remove the
guest first name from a planned stay at any time. Nothing is cleared or
deleted automatically after a stay ends.
**Decision needed from founder:** how long should completed and cancelled
stays be kept? Should the guest first name and/or booking reference be
cleared automatically some time after departure, and should old stays be
deleted automatically? How does backup retention (item 4) apply to guest
data that a host has removed? No period is suggested here.

---

**Each item above is a "Decision needed from founder" — nothing in this
document should be treated as settled until the founder (with input from a
legal/privacy professional where relevant) makes the call.**
