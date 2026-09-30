-- Optional service tag on actions (property_items), shown as the reminder's
-- label instead of "Action" when set. Additive; existing rows stay null.
--
-- ALREADY APPLIED in Supabase on 2026-09-30. Reference copy only — do not re-run.

begin;

alter table public.property_items
  add column service text;

alter table public.property_items
  add constraint property_items_service_check
    check (service is null
           or service in ('safety_checks', 'documents_renewals',
                          'maintenance_repairs', 'stays_calendar'));

commit;
