-- Account deletion: lets a signed-in user permanently delete their own
-- account and every row they own. Called by app/account/actions.ts
-- (deleteAccount) AFTER the app has removed the user's Storage files —
-- Supabase does not allow Storage files to be deleted from SQL.
--
-- ALREADY APPLIED in Supabase on 2026-09-30. Reference copy only — do not re-run.

begin;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  t text;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  -- Children before parents, so this works whether or not every foreign key
  -- cascades. Tables without a user_id column (or that don't exist) are skipped.
  foreach t in array array[
    'evidence_attachments',
    'maintenance_photos',
    'calendar_entries',
    'property_items',
    'maintenance_issues',
    'evidence_records',
    'eligibility_results',
    'properties'
  ]
  loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'user_id'
    ) then
      execute format('delete from public.%I where user_id = $1', t) using uid;
    end if;
  end loop;

  -- Finally the login itself.
  delete from auth.users where id = uid;
end;
$$;

-- Only signed-in users may call it, and it only ever acts on auth.uid().
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

commit;
