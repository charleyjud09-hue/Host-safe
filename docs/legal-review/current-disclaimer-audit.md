# Current Disclaimer Audit

**This is an internal content review, not legal advice or legal approval.**
It records what disclaimer wording currently exists in the HostSafe
application, and a non-legal assessment of whether it could accidentally
imply something it shouldn't. It does not constitute confirmation that the
wording is legally sufficient — that requires a qualified legal
professional.

Audited: 28 September 2026, against commit `a06db38` and the footer update
made alongside these documents. Rows 16 onwards were added as features
shipped. **Strict full review: 30 September 2026, against commit
`f9eb72c`** — see "Strict review" below the table.

| # | Wording (exact) | Location | Could it accidentally imply... |
|---|---|---|---|
| 1 | "HostSafe is not a fire-risk assessor and does not carry out fire-risk assessments." | `components/Disclaimer.tsx` | — none identified |
| 2 | "If your property is complex or outside its intended scope, you should speak with a competent fire-risk assessor." | `components/Disclaimer.tsx` | — none identified |
| 3 | "HostSafe is an early-stage organisational and educational tool. It does not provide legal advice, fire-risk assessments, or compliance certification, and it does not confirm that a property is safe or legally compliant." | `components/Footer.tsx` (updated as part of this pack) | — none identified |
| 4 | "HostSafe helps owners of small, simple self-catering holiday lets organise fire-safety information. It is an organisational and educational tool, not legal advice or a fire-risk assessment." | `app/layout.tsx` (page meta description) | — none identified |
| 5 | ~~"HostSafe is an organisational and educational tool. It does not provide legal advice, fire-risk assessments, or compliance certification, and it does not confirm that a property is safe or legally compliant."~~ **No longer in the app** (the old signed-in homepage was replaced by the property selector; row 9 now carries the equivalent wording there) | — | — |
| 6 | "HostSafe is designed for owners of small, simple self-catering holiday lets in England..." / "...advice from a competent fire-risk assessor." | `app/page.tsx` (public landing page) | — none identified |
| 7 | Eligibility-checker result messages (`suitableMessage`/`unsuitableMessage` in `lib/eligibility.ts`) — already state "not a fire-risk assessment" and "cannot tell you whether your property meets any legal requirement" | `/check`, `/properties/[id]/check`, dashboard | — none identified |
| 8 | "Reminders are based on the dates and statuses recorded in HostSafe. They are organisational prompts only and may not identify every requirement or deadline that applies to you." | `lib/attention.ts` (`REMINDER_NOTICE`), shown on `app/properties/[id]/page.tsx` and `app/properties/[id]/items/page.tsx` (the retired `/dashboard` no longer shows it) | — none identified; explicitly disclaims guaranteed reminders |
| 9 | "HostSafe is an organisational and educational tool for properties in England. It does not provide legal advice, fire-risk assessments, or compliance certification, and it does not confirm that a property is safe or legally compliant. Keeping records here does not by itself demonstrate legal compliance." | `app/page.tsx` signed-in property selector (moved unchanged from the retired `/dashboard` on 30 Sep 2026, together with the "simplified guidance is intended for smaller, straightforward accommodation" paragraph) | — none identified |
| 10 | "HostSafe helps you organise property information, evidence, documents, actions, and reminders. It is not an official records repository. You remain responsible for keeping original documents and appropriate backups, checking applicable requirements and deadlines, and submitting information directly to the relevant organisation where required." | `app/page.tsx` signed-in property selector (moved unchanged from the retired `/dashboard`) | — none identified; directly addresses "official document storage" and "Government submission" risks |
| 11 | "Keep this organisational — HostSafe does not..." / "HostSafe does not provide legal advice, fire-risk assessments, or..." | `app/properties/[id]/evidence/new/page.tsx` | — none identified |
| 12 | "Files uploaded to HostSafe are stored privately to help you organise your records. HostSafe does not verify, approve, submit, certify, or confirm the validity, completeness, currency, or legal effect of anything you upload." | `app/properties/[id]/evidence/[recordId]/edit/page.tsx` | — none identified; directly addresses "document verification" risk |
| 13 | "Marking an item as submitted records what you entered in HostSafe. It does not confirm that the document was received, accepted, valid, complete, or submitted by any deadline." | `components/PropertyItemForm.tsx` | — none identified; directly addresses "Government submission"/certification risk |
| 14 | "An organisational status only — not a legal or compliance judgement." | `components/PropertyItemForm.tsx` (status field helper) | — none identified |
| 15 | "HostSafe does not decide what is legally required — you add and manage these items yourself." | `app/properties/[id]/items/page.tsx` | — none identified |
| 16 | "Marking an issue resolved records what you entered in HostSafe. It does not confirm that a repair is complete, safe or compliant." (added in Phase 7a, pending review) | `lib/maintenance.ts` (`RESOLVED_NOTICE`), shown in `components/MaintenanceIssueForm.tsx` when Resolved is selected and on `app/properties/[id]/maintenance/[issueId]/page.tsx` for resolved issues | — none identified; directly addresses "repair verified / property safe" risk |
| 17 | "Photos are stored privately and only shown to you. Please avoid photos that show people or personal information." (added in Phase 7b, pending review) | `lib/maintenance-photos.ts` (`MAINTENANCE_PHOTO_NOTE`), shown in `components/MaintenancePhotoUpload.tsx` on the maintenance issue page | — none identified; "stored privately / only shown to you" is a factual privacy statement that should be checked against the final Privacy Notice |
| 18 | "Only add what you need to recognise this booking." (added in Stays & calendar Phase B, pending review) | `lib/calendar.ts` (`GUEST_NAME_HINT`), shown under the optional guest first name field in `components/GuestStayForm.tsx` | — none identified; a data-minimisation prompt, not a statement about what HostSafe does with the data |
| 19 | "This removes the guest’s first name. Dates, guest count, booking reference and stay status will be kept." (added in Stays & calendar Phase B, pending review) | `lib/calendar.ts` (`REMOVE_GUEST_NAME_NOTICE`), shown beside "Remove guest name" on `app/properties/[id]/calendar/[entryId]/page.tsx` | — none identified; deliberately does not describe this as deleting all guest-related data, because guest count and booking reference remain. Whether removal from the live database is "deletion" for privacy purposes (backups) needs legal review |
| 20 | "Cancelling removes the guest’s first name, and these dates will no longer stop another planned stay being recorded. Dates, guest count and booking reference will be kept. A cancelled stay cannot be changed back to planned." (added in Stays & calendar Phase B, pending review) | `lib/calendar.ts` (`CANCEL_STAY_NOTICE`), shown in the cancel confirmation on the guest stay page | — none identified; describes record-keeping only and makes no statement that the property is available |
| 21 | "These dates overlap an existing planned guest stay for this property. Choose different dates." (added in Stays & calendar Phase B, pending review) | `lib/calendar.ts` (`STAY_OVERLAP_ERROR`), shown on the guest stay form | — none identified; reveals nothing about the other stay |
| 22 | "Organise guest stays, planned work, cleanups and blocked dates for this property." / "Organise when this property has guests, is blocked, has work planned or is due a cleanup." (Stays & calendar, pending review) | Service card on `app/properties/[id]/page.tsx`; intro on `app/properties/[id]/calendar/page.tsx` | — none identified; organisational wording only, no claim that the property is available, ready or suitable for guests |
| 23 | "Planned work is a calendar entry only. It is separate from Maintenance & repairs issues and does not confirm that any work has been done, or that the property is safe, compliant or ready for guests." (Stays & calendar, pending review) | `lib/calendar.ts` (`PLANNED_WORK_NOTICE`), shown on the planned work form | — none identified; directly addresses "repair complete / property safe" risk |
| 24 | "A planned cleanup is a date you have chosen. HostSafe does not record or confirm that the property has been cleaned or is ready for guests." (Stays & calendar, pending review) | `lib/calendar.ts` (`PLANNED_CLEANUP_NOTICE`), shown on the planned cleanup form | — none identified; directly addresses "property cleaned / ready" risk |
| 25 | "Turnover dates are worked out from guest departure dates. They do not mean the property has been cleaned or is ready, safe or suitable for guests." plus the neutral row label "Same-day turnover" (Stays & calendar, pending review) | `lib/calendar.ts` (`TURNOVER_NOTICE`), shown on `app/properties/[id]/calendar/page.tsx` when guest stays are listed | — none identified |
| 26 | "If yes, HostSafe will not let you record a planned guest stay on any of these dates, including the first and last day." and the block overlap error "These dates overlap a planned guest stay for this property. Change the dates, or choose not to block guest stays." / "These dates overlap a custom block that blocks guest stays for this property. Choose different dates." (Stays & calendar, pending review) | `lib/calendar.ts` (`BLOCKING_HINT`, `BLOCK_OVERLAP_ERROR`, `STAY_BLOCKED_ERROR`) | — none identified; reveal nothing about the other entry |
| 28 | "Zero gap: check-out and the next check-in are at the same time, so there is no time for a turnover between these stays." shown as a warning, plus neutral gap wording such as "6 hours between check-out and check-in" (Stays & calendar, pending review) | `lib/calendar.ts` (`ZERO_GAP_WARNING`), `components/CalendarEntryList.tsx`; shown on the schedule and on both stays' pages | — none identified; states a timing fact only. The absence of a warning must not be read as HostSafe confirming a turnover is possible or that the property will be ready |
| 29 | Same-day turnover time messages: "Another guest stay checks out on this arrival date. Please add a check-in time." / "...checks in on this departure date. Please add a check-out time." / "...has no check-out time. Add a check-out time to that stay first." / "...has no check-in time. Add a check-in time to that stay first." / "On a same-day turnover, the check-out time must be no later than the next check-in time." and the hint "Times are optional, but needed when another stay checks out or in on the same day." (Stays & calendar, pending review) | `lib/calendar.ts`, guest stay form | — none identified; reveal no details of the other stay |
| 30 | Reminder level labels: "Urgent" (date passed), "Due very soon" (0–7 days), "Due soon" (8–30 days), "Later" (more than 30 days), "Open issue" (undated maintenance issue); every open, dated reminder now appears (changed 30 Sep 2026, pending review) | `lib/attention.ts` (`attentionLevelLabel`), shown on the property overview, Actions & reminders page and property selector | — "Urgent" is a date-based organisational label only; it must not be read as a legal deadline or a safety judgement. Listing every dated reminder does not mean the list covers every requirement (see row 8) |
| 31 | Delete-account warning ("This permanently deletes: your account and sign-in details / every property … / all records, actions, maintenance issues, calendar entries and property checks / every file and photo you have uploaded. This can’t be undone.") and the confirmation "Your account, properties, records and uploaded files have been removed from HostSafe." (added 30 Sep 2026, pending review) | `app/account/delete/page.tsx`, `app/account-deleted/page.tsx` | — "removed from HostSafe" is accurate for the live app; it does not claim removal from Supabase infrastructure backups, which the Privacy Notice must address (retention item 4) |
| 32 | "Subscriptions and billing are not set up yet. There is nothing to manage here at the moment, and no payment details are held." (added 30 Sep 2026) | `app/account/billing/page.tsx` | — none identified; factual placeholder, must be replaced when billing is built |
| 27 | "Don’t include names or contact details of guests, cleaners or contractors." (Stays & calendar, pending review) | `lib/calendar.ts` (`FREE_TEXT_HINT`), under the title and description fields for planned work and custom blocks | — none identified; a data-minimisation prompt |

## Strict review — 30 September 2026

A line-by-line pass of every user-facing sentence that touches safety,
law, compliance, privacy, advice or readiness. Standard applied: each
statement must be **true as an absolute**, must not imply a judgement
HostSafe cannot make, and should be as short as the meaning allows.
The rewrites were first proposed, then **applied the same day at the
founder's instruction — see section D for the live wording.** B2 still
needs legal confirmation before any legal statement is reintroduced.

### A. Wording not previously logged

| # | Wording (exact) | Location |
|---|---|---|
| A1 | "It does not give legal advice, and it does not certify or approve any property." / "It cannot guarantee that a property is safe or meets any legal requirement." / "Everything it produces is based on information you provide, and you remain responsible for checking it." | `components/Disclaimer.tsx` (public homepage, alongside rows 1–2) |
| A2 | Evidence category helpers, including "A written fire risk assessment is a legal requirement for the responsible person." and "… can be useful evidence where relevant to your property." (×8) | `lib/evidence-records.ts`, shown on the evidence form |
| A3 | "The property check is HostSafe's short suitability check. It helps show whether HostSafe's simplified approach is designed for a property like this one. It is not a fire-risk assessment or a legal compliance result." | `app/properties/[id]/safety/page.tsx` |
| A4 | "Keep property check records together." | Safety & checks service card, `app/properties/[id]/page.tsx` |
| A5 | "Six quick questions. This is not an assessment. It only helps you see whether HostSafe is designed for a property like yours." | `app/check/page.tsx`, `components/AddPropertyFlow.tsx`, `app/properties/[id]/check/page.tsx` (variant) |
| A6 | "Check if your property is suitable" (page title and heading) / "Check suitability" (header button) | `app/check/page.tsx`; `components/Header.tsx` (signed-out); `app/page.tsx` (frozen public homepage) |
| A7 | "Images are stored privately and are only shown to you. Please avoid photos that show people or personal information." | `components/PropertyImageForm.tsx` |
| A8 | "An organisational action, record, or submission tracker — not a legal requirement unless you've verified it yourself." | `app/properties/[id]/items/new/page.tsx` |
| A9 | "It takes about a minute, and nothing you enter is saved or sent." | `app/page.tsx` (frozen public homepage) |
| A10 | "Your answers are not saved or sent anywhere unless you choose to create an account." | `components/EligibilityChecker.tsx` (public check result) |
| A11 | Reminder level label "Urgent" (row 30) | `lib/attention.ts` |

### B. Findings, most serious first

**B1 — Inaccurate absolute privacy claim (fix before any external user).**
Rows 17 and A7 say files are "only shown to you". The service operator
can access stored files through the Supabase dashboard, and Supabase as
processor has infrastructure access. The true, testable claim is narrower.
*Proposed:* "Stored privately — other HostSafe users can't see it. Avoid
photos showing people or personal details."

**B2 — HostSafe states the law (legal review required).**
A2: "A written fire risk assessment is a legal requirement for the
responsible person." This is the only sentence in the app that asserts a
legal obligation. Whether it is accurate and complete for self-catering
lets is for a qualified adviser to confirm. It also sits beside helpers
calling records "useful evidence", which can read as "evidence of
compliance". *Proposed pending advice:* "Keep your fire risk assessment
here." (drop the legal assertion) and, for the others, "Keep [alarm and
detector check] records here." (drop "useful evidence").

**B3 — "Suitable" / "suitability" invites a safety reading.**
A3, A6: "Check if your property is suitable" can be read as "suitable to
let" or "safe". What the check actually answers is whether HostSafe's
simplified approach fits the property. The public homepage already uses
the better phrasing "See if HostSafe fits your property".
*Proposed:* page title/heading "Does HostSafe fit your property?"; header
button "Check fit"; Safety page intro "The property check shows whether
HostSafe's simplified approach fits this property. It is not a fire-risk
assessment or a compliance result." **Note:** A6 also appears on the
frozen public homepage, which cannot change without lifting the freeze.

**B4 — "Urgent" is a judgement HostSafe can't make.**
A11 / row 30: HostSafe only knows a date has passed, not how urgent the
matter is. *Proposed:* rename the level "Date passed" (keeps red).

**B5 — Positive result shown in reassuring teal.**
Row 7: the "appears to fit" result sits in a teal box, visually close to
an "all clear". The words are careful; the colour isn't. *Proposed:*
neutral (white/grey) styling for the fit result; keep amber for "may need
more tailored advice".

**B6 — Confusing legal phrasing.**
A8: "not a legal requirement unless you've verified it yourself" implies
the user can make something a legal requirement by verifying it.
*Proposed:* "Your own list of things to do, keep or send. HostSafe
doesn't decide what the law requires."

**B7 — Accurate but wordy (tighten; no meaning change).**
- Row 8 → "Reminders come only from the dates you've entered. They won't
  cover every requirement or deadline that applies to you."
- Rows 11 (two paragraphs) → "HostSafe doesn't check, certify or assess
  what you add, and isn't a substitute for professional advice."
- Rows 12 / Documents page → "Files are stored privately to help you
  organise records. HostSafe doesn't check, verify or approve them."
- Row 7 `suitableMessage` → "Your answers suggest your property fits the
  small, simple type HostSafe is designed for. This isn't a fire-risk
  assessment and can't tell you whether any legal requirement is met."
- Row 7 `unsuitableMessage` → "HostSafe is designed for small, simple
  properties. Your answers suggest you may need more tailored advice from
  a competent fire-risk assessor."
- Row 23 (planned work) → "A calendar entry only. It doesn't show that
  any work was done, or that the property is safe, compliant or ready for
  guests."
- Row 25 (turnover) → "Turnover dates come from departure dates only.
  They don't mean the property is cleaned, ready, safe or suitable."

**B8 — Accurate; keep as is.** Rows 1–3, 9, 10, 13, 14, 16, 19, 21, 24,
27–29, 31–32, A1, A5, A9, A10. A9 and A10 remain true only while no
analytics or tracking is added to the public check — re-check if that
changes.

### C. Consistency notes

- Five different phrasings of "not legal advice / not a fire-risk
  assessment" exist (rows 3, 4, 9, 11, A1). Each is accurate; converging on
  one canonical sentence would make future legal review easier.
- "Evidence" is used as a section name ("Evidence records"). Combined with
  row 9 ("does not by itself demonstrate legal compliance") this is
  acceptable, but "Records" alone would be the more neutral label.

### D. Applied — 30 September 2026

At the founder's instruction, B1–B7 were applied the same day, including
the two public-homepage button labels (the homepage freeze was lifted for
these lines only). The table rows above keep their original wording for
history; **the live wording is now:**

| Item | Live wording |
|---|---|
| B1 photos (row 17) | "Stored privately — other HostSafe users can’t see them. Avoid photos showing people or personal details." |
| B1 property image (A7) | "JPG, PNG or WebP, up to 5MB. Stored privately — other HostSafe users can’t see it. Avoid photos showing people or personal details." |
| B2 category helpers (A2) | "Keep your fire risk assessment here." / "Keep records of alarm and detector checks here." (and equivalents); no legal assertion, no "useful evidence" |
| B3 check page (A6) | Title and heading "Does HostSafe fit your property?"; header button "Check if HostSafe fits"; homepage buttons "Check if HostSafe fits your property" and "Start the check" |
| B3 Safety page (A3) | "The property check shows whether HostSafe’s simplified approach fits this property. It is not a fire-risk assessment or a compliance result." |
| B4 level label (A11) | "Date passed" (selector pill "N date passed") |
| B5 result styling | Neutral grey box for the fit result; amber kept for "may need tailored advice" |
| B6 new action (A8) | "Your own list of things to do, keep or send. HostSafe doesn’t decide what the law requires." |
| B7 reminders (row 8) | "Reminders come only from the dates you’ve entered. They won’t cover every requirement or deadline that applies to you." |
| B7 new record (row 11) | "HostSafe doesn’t check, certify or assess what you add, and isn’t a substitute for professional advice." |
| B7 files (row 12) | "Files are stored privately to help you organise records. HostSafe doesn’t check, verify or approve them, or confirm they are valid, complete or up to date." |
| B7 fit result (row 7) | "Your answers suggest HostSafe fits your property. This is not a fire-risk assessment and says nothing about whether your property is safe or meets any legal requirement." |
| B7 advice result (row 7) | "HostSafe is designed for small, simple properties. Your answers suggest you may need tailored advice from a competent fire-risk assessor." |
| B7 planned work (row 23) | "A calendar entry only, separate from Maintenance & repairs. It doesn’t show that any work was done, or that the property is safe, compliant or ready for guests." |
| B7 turnover (row 25) | "Turnover dates come from departure dates only. They don’t mean the property is cleaned, ready or safe for guests." |
| Responsibility (row 3, footer) | Added: "You remain responsible for your property’s fire safety and legal obligations." |
| Responsibility (A1, homepage) | "Everything it produces is based on information you provide, and you remain responsible for checking it." → "You remain responsible for your property’s fire safety and for meeting your legal obligations." |

**Limit of on-screen wording.** The founder asked for wording that
"completely negates any legal responsibility". On-screen statements can
describe what HostSafe is and place responsibility on the owner, as above,
but under UK law (Consumer Rights Act 2015, Unfair Contract Terms Act
1977) liability cannot be excluded entirely — for example for death or
personal injury caused by negligence — and over-broad exclusion wording
can be unenforceable or itself misleading. Any limitation of HostSafe's
liability belongs in the Terms of Service
(`terms-of-service-draft.md`) and **must be drafted or approved by a
qualified legal professional** before launch.

## Overall finding

*(28 Sep 2026)* No wording was found to falsely claim legal advice, legal
compliance, guaranteed reminders, official document storage, document
verification, Government submission, certification, or a professional
fire-safety assessment.

*(30 Sep 2026, strict review)* That still holds, with two exceptions that
should be fixed before any external user: **B1** (an absolute privacy
claim — "only shown to you" — that is not literally true) and **B2** (a
statement of law that needs qualified confirmation). B3–B6 are
misreadings the wording invites rather than false claims. B7 is length
only.

## Recommendation

*(28 Sep 2026)* The footer (row 3) previously lacked the "safe or legally
compliant" phrasing used elsewhere; it was updated to match.

*(30 Sep 2026)* Apply B1 immediately; take B2 to the legal reviewer
(removing the assertion in the meantime is the cautious option); decide
B3 together with whether to lift the public-homepage freeze; apply B4–B7
at the founder's discretion.

This finding is a content review only and is not a substitute for
professional legal review of the application as a whole.
