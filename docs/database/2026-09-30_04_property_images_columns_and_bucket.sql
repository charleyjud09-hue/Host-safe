-- ALREADY APPLIED in Supabase on 2026-09-30. Reference copy only — do not re-run.
-- Property images: the app code existed but this setup had never been applied
-- (no columns, no bucket), so every upload failed with "Bucket not found".

begin;

-- Image columns on properties (all optional).
alter table public.properties
  add column image_path text,
  add column image_content_type text,
  add column image_size_bytes integer,
  add column image_updated_at timestamptz;

alter table public.properties
  add constraint properties_image_content_type_check
    check (image_content_type is null
           or image_content_type in ('image/jpeg', 'image/png', 'image/webp')),
  add constraint properties_image_size_check
    check (image_size_bytes is null
           or image_size_bytes between 1 and 5242880);

-- The private bucket: 5MB limit, JPG/PNG/WebP only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp']);

commit;
