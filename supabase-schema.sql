-- medscribe-ai — Supabase schema
-- Run this in the Supabase SQL editor after creating a new project.
--
-- ⚠️ MVP posture: synthetic data only. See HIPAA_GOLIVE.md before real PHI.

-- ─────────────────────────────────────────────────────────────
-- Table: consultations
-- ─────────────────────────────────────────────────────────────
create table if not exists public.consultations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  audio_path   text,                       -- Storage object path, not a signed URL
  transcript   text,
  clinical_note jsonb,                     -- { subjective, objective, assessment, plan }
  created_at   timestamptz not null default now()
);

create index if not exists consultations_user_id_idx
  on public.consultations (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security — users see only their own rows
-- ─────────────────────────────────────────────────────────────
alter table public.consultations enable row level security;

drop policy if exists "consultations_select_own" on public.consultations;
create policy "consultations_select_own"
  on public.consultations for select
  using (auth.uid() = user_id);

drop policy if exists "consultations_insert_own" on public.consultations;
create policy "consultations_insert_own"
  on public.consultations for insert
  with check (auth.uid() = user_id);

drop policy if exists "consultations_update_own" on public.consultations;
create policy "consultations_update_own"
  on public.consultations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "consultations_delete_own" on public.consultations;
create policy "consultations_delete_own"
  on public.consultations for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Storage bucket: audio-uploads (private)
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('audio-uploads', 'audio-uploads', false)
on conflict (id) do nothing;

-- Storage RLS — path convention: <user_id>/<filename>
drop policy if exists "audio_select_own" on storage.objects;
create policy "audio_select_own"
  on storage.objects for select
  using (
    bucket_id = 'audio-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "audio_insert_own" on storage.objects;
create policy "audio_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'audio-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "audio_delete_own" on storage.objects;
create policy "audio_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'audio-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
