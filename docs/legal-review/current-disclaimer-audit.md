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
