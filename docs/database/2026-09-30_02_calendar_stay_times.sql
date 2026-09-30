-- ALREADY APPLIED in Supabase on 2026-09-30. Reference copy only — do not re-run.
-- Optional check-in / check-out times on guest stays.

begin;

alter table public.calendar_entries
  add column arrival_time time,
  add column departure_time time;

-- Times only on guest stays.
alter table public.calendar_entries
  add constraint calendar_entries_stay_times_guest_only_check
    check (entry_type = 'guest_stay' or (arrival_time is null and departure_time is null));

-- No two planned stays can overlap in time. A missing check-in counts as the
-- start of the arrival day and a missing check-out as the end of the departure
-- day, so a same-day turnover is only accepted once both times are recorded
-- and check-out is at or before check-in (a zero gap is allowed).
alter table public.calendar_entries
  add constraint calendar_entries_guest_stays_no_time_overlap
    exclude using gist (
      property_id with =,
      (tsrange(
         start_date + coalesce(arrival_time, time '00:00'),
         end_date + coalesce(departure_time, time '24:00'),
         '[)'
       )) with &&
    )
    where (entry_type = 'guest_stay' and status = 'planned');

commit;
