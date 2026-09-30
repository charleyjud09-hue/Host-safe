# Privacy Notice — Review Checklist

**This is not a finished Privacy Notice.** It is a checklist and a factual
inventory of what HostSafe's code currently stores, prepared so a qualified
legal/privacy professional can write a real Privacy Notice. Do not publish
this document, or any Privacy Notice based on it, without that review.

## Data categories HostSafe currently stores

| Category | What's stored | Where (table/bucket) |
|---|---|---|
| Account information | Email, password (hashed by Supabase Auth), email-confirmation status | Supabase Auth (`auth.users`) |
| Property details | Name, address, type, floors, guest capacity, notes | `public.properties` |
| Questionnaire answers/results | Eligibility-checker answers, and whether the result was flagged, linked to a property (or unlinked for early results) | `public.eligibility_results` |
| Evidence-record details | Category, title, notes, dates, status | `public.evidence_records` |
| Uploaded attachments | Files (JPG/PNG/WebP/PDF), original filename, content type, size, upload date | Supabase Storage, private bucket `evidence-attachments`; metadata in `public.evidence_attachments` |
| Property items/actions/reminders | Title, description, type, priority, status, due/review/completed/submitted dates, destination, notes | `public.property_items` |
| Maintenance issues (added in Phase 7a, pending review) | Per property: title, optional location within the property, optional description, priority, status, reported/due/resolved dates, optional free-text notes. No photos, attachments, contractor or guest fields. Free-text description/notes could still contain third-party personal data (e.g. a contractor's or guest's name) if a user types it | `public.maintenance_issues` |
| Maintenance photos (added in Phase 7b, pending review) | Up to 10 photos per maintenance issue (JPG/PNG/WebP, 10MB each), original filename, content type, size, upload date. Photos may show people, guest belongings, documents or other personal data; retention is until the user deletes the photo or the issue | Supabase Storage, private bucket `maintenance-photos`; metadata in `public.maintenance_photos` |
| Guest stays (added in Stays & calendar Phase B, pending review) | Per property: arrival date, departure date, status (planned/cancelled), and three optional fields — guest first name, number of guests, booking reference. **This is the first category holding personal data about people who are not HostSafe users (guests).** No surname, email, phone, notes, payment, identity or health data is collected. The first name is cleared automatically when a stay is cancelled and can be removed by the host at any time; the whole stay can be permanently deleted. Retention is otherwise until the user deletes it | `public.calendar_entries` |
| Other calendar entries (Stays & calendar, pending review) | Per property: planned work (title, date or date range), planned cleanup (date only), custom blocks (title, description, date or date range, whether it blocks guest stays). No personal-data fields, but free-text titles/descriptions could contain third-party names if a user types them (the form asks them not to) | `public.calendar_entries` |
| Technical/session data | Authentication session cookies necessary to keep a user signed in | Managed by Supabase Auth / `@supabase/ssr` |

## Checklist — information still required before a public Privacy Notice can be finalised

- [ ] Business/controller name (the legal entity or individual who is the
      data controller)
- [ ] Business contact details (a real contact point for privacy queries)
- [ ] Lawful basis under UK GDPR for each processing purpose listed above
- [ ] Full Supabase / subprocessor details (which Supabase products are
      used, and any other third-party processor, e.g. hosting)
- [ ] International-transfer position (where Supabase actually stores this
      data, and what transfer mechanism applies, if outside the UK/EEA)
- [ ] Retention periods for each data category (see
      `retention-and-deletion-decisions.md` — not yet decided)
- [ ] Account-deletion process (self-service immediate deletion built on
      30 Sep 2026 under Account settings; the Privacy Notice must describe
      it and any backup-retention caveat — see same file, items 2 and 4)
- [ ] Backup/deletion handling (whether Supabase's own infrastructure
      backups retain deleted data, and for how long)
- [ ] Data-subject-rights process (how a user exercises access, correction,
      deletion, portability, objection rights)
- [ ] ICO complaint information (the standard "you can complain to the ICO"
      notice, with correct current ICO contact details)
- [ ] Whether a Data Protection Officer is required or appointed
- [ ] Guest data — controller/processor roles (whether the host, HostSafe,
      or both are controllers of guest first names and booking references,
      and whether processor terms are needed between HostSafe and hosts)
- [ ] Guest data — lawful basis, and what hosts may need to tell their
      guests about recording their details in HostSafe
- [ ] Guest data — how a guest's request to access, correct or delete
      their data would reach HostSafe or the host, and be handled
- [ ] Guest data — all of the above resolved before any external user
      uses the guest-stay feature
- [ ] Cookie/analytics details, if any tracking or analytics tooling is
      added in future (none is currently in the app)

## Explicitly not claimed in this document
No retention period, lawful basis, international-transfer position, or
security certification is asserted anywhere in this checklist — all of
these are open questions for the checklist above, not settled facts.

**A qualified legal/privacy professional must review this checklist, and
write the actual Privacy Notice from it, before anything is published to
users.**
