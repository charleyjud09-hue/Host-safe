-- ALREADY APPLIED in Supabase on 2026-09-30. Reference copy only — do not re-run.
--
-- Why: the original "own maintenance files: insert" policy refused every
-- maintenance photo upload ("new row violates row-level security policy").
-- Its subquery on public.properties most likely resolved the unqualified
-- column `name` to properties.name instead of storage.objects.name. Every
-- file-path reference below is written as objects.name to avoid that.
-- The property-images bucket also had no Storage policies at all.

begin;

-- 1. Replace the broken maintenance-photos upload rule. File path is
--    {user_id}/{property_id}/{issue_id}/{file}.
drop policy "own maintenance files: insert" on storage.objects;

create policy "own maintenance files: insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'maintenance-photos'
    and (storage.foldername(objects.name))[1] = (select auth.uid())::text
    and exists (
      select 1
      from public.maintenance_issues i
      join public.properties p on p.id = i.property_id
      where i.id::text = (storage.foldername(objects.name))[3]
        and p.id::text = (storage.foldername(objects.name))[2]
        and i.user_id = (select auth.uid())
        and p.user_id = (select auth.uid())
    )
  );

-- 2. Add the missing property-images rules. File path is
--    {user_id}/{property_id}/{file}.
create policy "own property images: select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(objects.name))[1] = (select auth.uid())::text
  );

create policy "own property images: insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(objects.name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.properties p
      where p.id::text = (storage.foldername(objects.name))[2]
        and p.user_id = (select auth.uid())
    )
  );

create policy "own property images: delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(objects.name))[1] = (select auth.uid())::text
  );

commit;
