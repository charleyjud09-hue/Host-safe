-- ALREADY APPLIED in Supabase on 2026-10-02. Reference copy only — do not re-run.
--
-- Founding-member price: the first 50 members pay £12 (Membership) or
-- £29 (Premium) a month for as long as their membership continues.
-- They lose it for good when their membership ends — after cancelling,
-- after payments fail and the provider gives up, or when the account is
-- deleted (the row is deleted with the account, freeing the place).
--
-- A place is held from the moment a trial starts. Places free up again when
-- a holder's membership ends, so there are never more than 50 holders.
-- Stores no payment details.

begin;

alter table public.memberships
  add column founding_price       boolean not null default false,
  add column founding_price_lost  boolean not null default false;

alter table public.memberships
  add constraint memberships_founding_check
    check (not (founding_price and founding_price_lost));

-- When a membership ends, its founding price ends with it, permanently.
create or replace function public.memberships_end_founding_price()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'ended' and new.founding_price then
    new.founding_price := false;
    new.founding_price_lost := true;
  end if;
  return new;
end;
$$;

create trigger memberships_end_founding_price
  before insert or update on public.memberships
  for each row execute function public.memberships_end_founding_price();

-- How many founding places are left. Only a number, so it is safe to show
-- on the public pricing page.
create or replace function public.founding_places_left()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select greatest(0, 50 - (select count(*) from public.memberships where founding_price))::integer;
$$;

revoke all on function public.founding_places_left() from public;
grant execute on function public.founding_places_left() to anon, authenticated;

-- Gives an account a founding place if one is free. Only the server calls
-- this (when a trial starts, once payments are connected). The lock stops
-- two sign-ups at the same moment both taking the 50th place.
create or replace function public.claim_founding_price(target_user uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  holders integer;
begin
  perform pg_advisory_xact_lock(hashtext('letnook_founding_price'));

  -- Already holds it, or lost it before: no change.
  if exists (
    select 1 from public.memberships
    where user_id = target_user and (founding_price or founding_price_lost)
  ) then
    return (select founding_price from public.memberships where user_id = target_user);
  end if;

  select count(*) into holders from public.memberships where founding_price;
  if holders >= 50 then
    return false;
  end if;

  update public.memberships
     set founding_price = true
   where user_id = target_user
     and status in ('trialing', 'active', 'past_due');
  return found;
end;
$$;

revoke all on function public.claim_founding_price(uuid) from public, anon, authenticated;
grant execute on function public.claim_founding_price(uuid) to service_role;

commit;
