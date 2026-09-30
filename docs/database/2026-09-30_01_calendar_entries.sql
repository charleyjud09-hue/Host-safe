-- ALREADY APPLIED in Supabase on 2026-09-30. Reference copy only — do not re-run.
-- Stays & calendar: one table for guest stays, planned work, planned cleanup
-- and custom blocks. See lib/calendar.ts for the range specification the
-- app mirrors.

begin;

-- Needed for the two exclusion constraints (uuid/text equality inside a GiST index).
create extension if not exists btree_gist with schema extensions;

create table public.calendar_entries (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid()
                        references auth.users (id) on delete cascade,
  property_id         uuid not null
                        references public.properties (id) on delete cascade,
  entry_type          text not null,
  status              text not null default 'planned',
  start_date          date not null,
  end_date            date not null,
  title               text,
  description         text,
  blocks_guest_stays  boolean,
  guest_first_name    text,
  guest_count         integer,
  booking_reference   text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- C1
  constraint calendar_entries_type_check
    check (entry_type in ('guest_stay', 'planned_work', 'planned_cleanup', 'custom_block')),

  -- C2
  constraint calendar_entries_status_check
    check (status in ('planned', 'cancelled')),

  -- C3
  constraint calendar_entries_cancel_guest_only_check
    check (status = 'planned' or entry_type = 'guest_stay'),

  -- C4
  constraint calendar_entries_date_bounds_check
    check (start_date >= date '2000-01-01' and end_date <= date '2100-12-31'),

  -- C5
  constraint calendar_entries_date_shape_check
    check (
      case entry_type
        when 'guest_stay'      then end_date > start_date
        when 'planned_cleanup' then end_date = start_date
        else                        end_date >= start_date
      end
    ),

  -- C6
  constraint calendar_entries_title_check
    check (
      case
        when entry_type in ('guest_stay', 'planned_cleanup') then title is null
        else title is not null and btrim(title) <> '' and char_length(title) <= 80
      end
    ),

  -- C7
  constraint calendar_entries_description_check
    check (
      case entry_type
        when 'guest_stay' then description is null
        when 'planned_work' then
          description is null
          or (btrim(description) <> '' and char_length(description) <= 300)
        when 'planned_cleanup' then
          description is null
          or (btrim(description) <> '' and char_length(description) <= 200)
        else
          description is not null
          and btrim(description) <> ''
          and char_length(description) <= 500
      end
    ),

  -- C8
  constraint calendar_entries_blocking_flag_check
    check ((entry_type = 'custom_block') = (blocks_guest_stays is not null)),

  -- C9
  constraint calendar_entries_guest_fields_guest_only_check
    check (
      entry_type = 'guest_stay'
      or (guest_first_name is null and guest_count is null and booking_reference is null)
    ),

  -- C10
  constraint calendar_entries_guest_first_name_check
    check (
      guest_first_name is null
      or (btrim(guest_first_name) <> '' and char_length(guest_first_name) <= 40)
    ),

  -- C11
  constraint calendar_entries_guest_count_check
    check (guest_count is null or guest_count between 1 and 50),

  -- C12
  constraint calendar_entries_booking_reference_check
    check (
      booking_reference is null
      or (btrim(booking_reference) <> '' and char_length(booking_reference) <= 40)
    ),

  -- C13
  constraint calendar_entries_cancelled_no_name_check
    check (status <> 'cancelled' or guest_first_name is null),

  -- X1: planned guest stays at one property cannot overlap each other.
  constraint calendar_entries_guest_stays_no_overlap
    exclude using gist (
      property_id with =,
      (daterange(start_date, end_date, '[)')) with &&
    )
    where (entry_type = 'guest_stay' and status = 'planned'),

  -- X2: a planned guest stay cannot overlap a blocking custom block.
  constraint calendar_entries_guest_stay_vs_blocking_block
    exclude using gist (
      property_id with =,
      (daterange(
         start_date,
         case when entry_type = 'guest_stay' then end_date else end_date + 1 end,
         '[)'
       )) with &&,
      entry_type with <>
    )
    where (
      status = 'planned'
      and (
        entry_type = 'guest_stay'
        or (entry_type = 'custom_block' and blocks_guest_stays is true)
      )
    )
);

create index calendar_entries_property_start_idx
  on public.calendar_entries (property_id, start_date);

create index calendar_entries_user_idx
  on public.calendar_entries (user_id);

create trigger calendar_entries_set_updated_at
  before update on public.calendar_entries
  for each row execute function public.set_updated_at();

alter table public.calendar_entries enable row level security;

revoke all on public.calendar_entries from anon;
grant select, insert, update, delete on public.calendar_entries to authenticated;

create policy "calendar_entries_select_own"
  on public.calendar_entries for select to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.properties p
      where p.id = calendar_entries.property_id
        and p.user_id = (select auth.uid())
    )
  );

create policy "calendar_entries_insert_own"
  on public.calendar_entries for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.properties p
      where p.id = calendar_entries.property_id
        and p.user_id = (select auth.uid())
    )
  );

create policy "calendar_entries_update_own"
  on public.calendar_entries for update to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.properties p
      where p.id = calendar_entries.property_id
        and p.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.properties p
      where p.id = calendar_entries.property_id
        and p.user_id = (select auth.uid())
    )
  );

create policy "calendar_entries_delete_own"
  on public.calendar_entries for delete to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.properties p
      where p.id = calendar_entries.property_id
        and p.user_id = (select auth.uid())
    )
  );

commit;
