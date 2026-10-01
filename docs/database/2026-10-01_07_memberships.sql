-- ALREADY APPLIED in Supabase on 2026-10-01. Reference copy only — do not re-run.
-- (Verified: the founder's account could still save a property afterwards.)
--
-- Membership phase 2a: the database remembers each account's membership,
-- and enforces read-only mode and property limits itself, so they can't be
-- bypassed by calling the Supabase API directly.
--
-- Account states the app derives from this table:
--   no row                    -> never joined ("Redeem 30-day trial FREE")
--   trialing / active /
--   past_due / complimentary  -> full access ("My Subscription")
--   ended                     -> read-only ("Join Back")
--
-- Only the server can write memberships (the service role, used later by
-- the payment provider's webhooks). Signed-in users can only read their own.

begin;

-- 1. The table ---------------------------------------------------------------

create table public.memberships (
  user_id                   uuid primary key
                              references auth.users (id) on delete cascade,
  plan                      text not null,
  billing_interval          text not null,
  status                    text not null,
  -- Trial end while trialing; next renewal while active.
  current_period_end        timestamptz,
  cancel_at_period_end      boolean not null default false,
  -- Set once, so a free trial can only ever be used once per account.
  trial_started_at          timestamptz,
  -- Filled in by the payment provider later. No card details are ever stored.
  provider                  text,
  provider_customer_id      text,
  provider_subscription_id  text unique,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  constraint memberships_plan_check
    check (plan in ('membership', 'premium')),
  constraint memberships_interval_check
    check (billing_interval in ('month', 'year')),
  constraint memberships_status_check
    check (status in ('trialing', 'active', 'past_due', 'ended', 'complimentary')),
  constraint memberships_period_check
    check (status in ('ended', 'complimentary') or current_period_end is not null)
);

create trigger memberships_set_updated_at
  before update on public.memberships
  for each row execute function public.set_updated_at();

alter table public.memberships enable row level security;

revoke all on public.memberships from anon, authenticated;
grant select on public.memberships to authenticated;

create policy "memberships_select_own"
  on public.memberships for select to authenticated
  using ((select auth.uid()) = user_id);
-- Deliberately no insert / update / delete policies for users.

-- 2. Access checks -------------------------------------------------------------

-- True while the signed-in user may add or change things. A 3-day grace
-- period covers a late renewal update from the payment provider.
create or replace function public.has_edit_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = (select auth.uid())
      and (
        m.status = 'complimentary'
        or (
          m.status in ('trialing', 'active', 'past_due')
          and m.current_period_end > now() - interval '3 days'
        )
      )
  );
$$;

-- The signed-in user's property limit: 5 (Membership), 25 (Premium), 0 without access.
create or replace function public.property_limit()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select case when m.plan = 'premium' then 25 else 5 end
    from public.memberships m
    where m.user_id = (select auth.uid())
      and public.has_edit_access()
  ), 0);
$$;

revoke all on function public.has_edit_access() from public, anon;
revoke all on function public.property_limit() from public, anon;
grant execute on function public.has_edit_access() to authenticated;
grant execute on function public.property_limit() to authenticated;

-- 3. Read-only enforcement on records ------------------------------------------

-- Blocks adding or changing records without access. Never blocks:
--   * deletes (no trigger on delete)
--   * admin/server work (no signed-in user)
--   * changes cascaded from a delete (trigger depth > 1)
--   * removing a guest's first name, or cancelling a stay
--   * removing a property image
create or replace function public.enforce_edit_access()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb;
  new_row jsonb;
begin
  if (select auth.uid()) is null
     or pg_trigger_depth() > 1
     or public.has_edit_access() then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    old_row := to_jsonb(old);
    new_row := to_jsonb(new);

    -- Removing personal data is never paywalled.
    if tg_table_name = 'calendar_entries'
       and (new_row - 'guest_first_name' - 'status' - 'updated_at')
         = (old_row - 'guest_first_name' - 'status' - 'updated_at')
       and new_row ->> 'guest_first_name' is null
       and (new_row ->> 'status' = old_row ->> 'status'
            or (old_row ->> 'status' = 'planned' and new_row ->> 'status' = 'cancelled')) then
      return new;
    end if;

    if tg_table_name = 'properties'
       and (new_row - 'image_path' - 'image_content_type' - 'image_size_bytes'
                    - 'image_updated_at' - 'updated_at')
         = (old_row - 'image_path' - 'image_content_type' - 'image_size_bytes'
                    - 'image_updated_at' - 'updated_at')
       and new_row ->> 'image_path' is null then
      return new;
    end if;
  end if;

  raise exception 'A membership is needed to add or change records'
    using hint = 'read_only';
end;
$$;

create trigger properties_enforce_edit_access
  before insert or update on public.properties
  for each row execute function public.enforce_edit_access();
create trigger evidence_records_enforce_edit_access
  before insert or update on public.evidence_records
  for each row execute function public.enforce_edit_access();
create trigger evidence_attachments_enforce_edit_access
  before insert or update on public.evidence_attachments
  for each row execute function public.enforce_edit_access();
create trigger property_items_enforce_edit_access
  before insert or update on public.property_items
  for each row execute function public.enforce_edit_access();
create trigger maintenance_issues_enforce_edit_access
  before insert or update on public.maintenance_issues
  for each row execute function public.enforce_edit_access();
create trigger maintenance_photos_enforce_edit_access
  before insert or update on public.maintenance_photos
  for each row execute function public.enforce_edit_access();
create trigger calendar_entries_enforce_edit_access
  before insert or update on public.calendar_entries
  for each row execute function public.enforce_edit_access();

-- 4. Property limit ---------------------------------------------------------------

create or replace function public.enforce_property_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
begin
  if (select auth.uid()) is null then
    return new;
  end if;

  select count(*) into current_count
  from public.properties
  where user_id = new.user_id;

  if current_count >= public.property_limit() then
    raise exception 'Property limit reached for this plan'
      using hint = 'property_limit';
  end if;
  return new;
end;
$$;

create trigger properties_enforce_limit
  before insert on public.properties
  for each row execute function public.enforce_property_limit();

-- 5. Uploads need access ------------------------------------------------------------

-- Restrictive: applies on top of the existing per-bucket upload rules.
-- Viewing and deleting files are unaffected.
create policy "uploads need membership"
  on storage.objects as restrictive for insert to authenticated
  with check (
    bucket_id not in ('evidence-attachments', 'maintenance-photos', 'property-images')
    or public.has_edit_access()
  );

create policy "upload changes need membership"
  on storage.objects as restrictive for update to authenticated
  using (true)
  with check (
    bucket_id not in ('evidence-attachments', 'maintenance-photos', 'property-images')
    or public.has_edit_access()
  );

-- 6. Existing accounts --------------------------------------------------------------

-- Every account that exists before launch (yours and any test accounts)
-- gets complimentary Premium, so nobody is locked out when this runs.
-- Accounts created after this have no row until they start a trial.
insert into public.memberships (user_id, plan, billing_interval, status)
select id, 'premium', 'month', 'complimentary'
from auth.users
on conflict (user_id) do nothing;

commit;
