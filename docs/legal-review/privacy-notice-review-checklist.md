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
- [ ] Account-deletion process (not yet built — see same file)
- [ ] Backup/deletion handling (whether Supabase's own infrastructure
      backups retain deleted data, and for how long)
- [ ] Data-subject-rights process (how a user exercises access, correction,
      deletion, portability, objection rights)
- [ ] ICO complaint information (the standard "you can complain to the ICO"
      notice, with correct current ICO contact details)
- [ ] Whether a Data Protection Officer is required or appointed
- [ ] Cookie/analytics details, if any tracking or analytics tooling is
      added in future (none is currently in the app)

## Explicitly not claimed in this document
No retention period, lawful basis, international-transfer position, or
security certification is asserted anywhere in this checklist — all of
these are open questions for the checklist above, not settled facts.

**A qualified legal/privacy professional must review this checklist, and
write the actual Privacy Notice from it, before anything is published to
users.**
