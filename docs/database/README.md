# Database changes (reference copies)

These files are **copies of SQL that has already been run** in the Supabase
SQL editor for the HostSafe project. They are kept here so the database
setup can be understood, reviewed and rebuilt. **Do not run them again
against the live project** — most would fail (objects already exist) or
duplicate policies.

Files are named in the order they were applied.

| File | Applied | What it does |
|---|---|---|
| `2026-09-30_01_calendar_entries.sql` | 30 Sep 2026 | Stays & calendar table: all four entry types, CHECK constraints, overlap exclusion constraints (needs `btree_gist`), RLS, grants, `updated_at` trigger |
| `2026-09-30_02_calendar_stay_times.sql` | 30 Sep 2026 | Optional check-in/check-out times on guest stays, plus the time-based no-overlap rule for same-day turnovers |
| `2026-09-30_03_storage_policy_fix_and_property_image_policies.sql` | 30 Sep 2026 | Replaces the broken maintenance-photos upload policy; adds the missing property-images Storage policies |
| `2026-09-30_04_property_images_columns_and_bucket.sql` | 30 Sep 2026 | Property image columns on `properties` and the private `property-images` bucket (these had never been applied) |

## Not yet recorded here

Earlier SQL was run before this folder existed and was never saved to the
repository. It is **not reconstructed here** because the exact statements
that ran are unknown. That covers:

- `properties`, `eligibility_results`, `evidence_records`, `property_items`,
  `maintenance_issues`, `maintenance_photos`, `evidence_attachments` tables
  and their RLS policies, grants and triggers
- the `public.set_updated_at()` trigger function
- the `evidence-attachments` and `maintenance-photos` buckets and the
  `evidence-attachments` Storage policies

To capture the real definitions, run read-only catalog queries in the SQL
editor (for example `pg_get_constraintdef`, `pg_policies`,
`pg_get_functiondef`, `storage.buckets`) and save the output as a new
reference file.

From now on, every SQL change should be added here as a new dated file at
the same time it is run.
