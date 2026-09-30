# Current Disclaimer Audit

**This is an internal content review, not legal advice or legal approval.**
It records what disclaimer wording currently exists in the HostSafe
application, and a non-legal assessment of whether it could accidentally
imply something it shouldn't. It does not constitute confirmation that the
wording is legally sufficient — that requires a qualified legal
professional.

Audited: 28 September 2026, against commit `a06db38` and the footer update
made alongside these documents.

| # | Wording (exact) | Location | Could it accidentally imply... |
|---|---|---|---|
| 1 | "HostSafe is not a fire-risk assessor and does not carry out fire-risk assessments." | `components/Disclaimer.tsx` | — none identified |
| 2 | "If your property is complex or outside its intended scope, you should speak with a competent fire-risk assessor." | `components/Disclaimer.tsx` | — none identified |
| 3 | "HostSafe is an early-stage organisational and educational tool. It does not provide legal advice, fire-risk assessments, or compliance certification, and it does not confirm that a property is safe or legally compliant." | `components/Footer.tsx` (updated as part of this pack) | — none identified |
| 4 | "HostSafe helps owners of small, simple self-catering holiday lets organise fire-safety information. It is an organisational and educational tool, not legal advice or a fire-risk assessment." | `app/layout.tsx` (page meta description) | — none identified |
| 5 | "HostSafe is an organisational and educational tool. It does not provide legal advice, fire-risk assessments, or compliance certification, and it does not confirm that a property is safe or legally compliant." | `app/page.tsx` (signed-in homepage) | — none identified |
| 6 | "HostSafe is designed for owners of small, simple self-catering holiday lets in England..." / "...advice from a competent fire-risk assessor." | `app/page.tsx` (public landing page) | — none identified |
| 7 | Eligibility-checker result messages (`suitableMessage`/`unsuitableMessage` in `lib/eligibility.ts`) — already state "not a fire-risk assessment" and "cannot tell you whether your property meets any legal requirement" | `/check`, `/properties/[id]/check`, dashboard | — none identified |
| 8 | "Reminders are based on the dates and statuses recorded in HostSafe. They are organisational prompts only and may not identify every requirement or deadline that applies to you." | `app/dashboard/page.tsx`, `app/properties/[id]/items/page.tsx` | — none identified; explicitly disclaims guaranteed reminders |
| 9 | "HostSafe is an organisational and educational tool for properties in England. It does not provide legal advice, fire-risk assessments, or compliance certification, and it does not confirm that a property is safe or legally compliant. Keeping records here does not by itself demonstrate legal compliance." | `app/dashboard/page.tsx` | — none identified |
| 10 | "HostSafe helps you organise property information, evidence, documents, actions, and reminders. It is not an official records repository. You remain responsible for keeping original documents and appropriate backups, checking applicable requirements and deadlines, and submitting information directly to the relevant organisation where required." | `app/dashboard/page.tsx` | — none identified; directly addresses "official document storage" and "Government submission" risks |
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
| 27 | "Don’t include names or contact details of guests, cleaners or contractors." (Stays & calendar, pending review) | `lib/calendar.ts` (`FREE_TEXT_HINT`), under the title and description fields for planned work and custom blocks | — none identified; a data-minimisation prompt |

## Overall finding

No wording currently in the app was found to falsely claim legal advice,
legal compliance, guaranteed reminders, official document storage,
document verification, Government submission, certification, or a
professional fire-safety assessment. Every user-facing surface reviewed
carries an explicit disclaimer addressing at least one of these risks.

## Recommendation

The footer (row 3) previously lacked the "safe or legally compliant"
phrasing used elsewhere; it has been updated (see the commit accompanying
this document) to match the fuller wording already used on the dashboard
and signed-in homepage. No other correction was identified as necessary at
the time of this audit.

This finding is a content review only and is not a substitute for
professional legal review of the application as a whole.
