-- ============================================================
-- Migration 2: Row Level Security (RLS) policies
-- ============================================================
-- All data security is enforced in PostgreSQL via RLS.
-- Policies use auth.uid() (Supabase Auth) joined to usuarios
-- to determine the current user's perfil (ADMIN / ESCOLA) and
-- escola_id. The frontend is NOT trusted for these checks.
-- ============================================================

-- Helper: returns the current authenticated business user row,
-- or NULL if the auth uid is not linked to a usuarios record.
create or replace function auth.usuario_context()
returns table (
  user_id   bigint,
  perfil    varchar,
  escola_id bigint
)
language sql
stable
as $$
  select
    u.id,
    u.perfil,
    u.escola_id
  from usuarios u
  where u.auth_user_id = auth.uid()
  limit 1;
$$;

-- ============================================================
-- Enable RLS on all tables with school-scoped data
-- ============================================================
alter table escolas          enable row level security;
alter table usuarios         enable row level security;
alter table alunos           enable row level security;
alter table faltas           enable row level security;
alter table envios_faltas    enable row level security;
alter table importacoes_pdf  enable row level security;

-- ============================================================
-- Policy helpers (view inline definitions)
-- isAdmin():  perfil = 'ADMIN'
-- isSchool():  perfil = 'ESCOLA' with non-null escola_id
-- ============================================================

-- ============================================================
-- TABLE: escolas
-- ============================================================
-- ADMIN: can SELECT / INSERT / UPDATE all escolas
-- ESCOLA: can only SELECT the escola it belongs to
create policy "escolas_select_all"
  on escolas for select
  using (
    (select perfil from auth.usuario_context()) = 'ADMIN'
    or
    (select perfil from auth.usuario_context()) = 'ESCOLA'
    and (select escola_id from auth.usuario_context()) = escolas.id
  );

create policy "escolas_write_admin"
  on escolas for all
  to authenticated
  with check (
    (select perfil from auth.usuario_context()) = 'ADMIN'
  );

-- ============================================================
-- TABLE: usuarios (business profiles)
-- ============================================================
-- ADMIN: can SELECT / UPDATE all usuarios
-- ESCOLA: can only SELECT / UPDATE its own profile
create policy "usuarios_select_admin"
  on usuarios for select
  using (
    (select perfil from auth.usuario_context()) = 'ADMIN'
  );

create policy "usuarios_select_self"
  on usuarios for select
  using (
    (select auth_user_id from auth.usuario_context()) = usuarios.auth_user_id
  );

create policy "usuarios_write_admin"
  on usuarios for all
  to authenticated
  with check (
    (select perfil from auth.usuario_context()) = 'ADMIN'
  );

create policy "usuarios_update_self"
  on usuarios for update
  to authenticated
  using (
    (select auth_user_id from auth.usuario_context()) = usuarios.auth_user_id
  );

-- ============================================================
-- TABLE: alunos
-- ============================================================
-- ADMIN: can SELECT / INSERT / UPDATE all alunos (any escola)
-- ESCOLA: can only SELECT / INSERT / UPDATE alunos of its own escola
create policy "alunos_select_by_school"
  on alunos for select
  using (
    (select perfil from auth.usuario_context()) = 'ADMIN'
    or
    (select escola_id from auth.usuario_context()) = alunos.escola_id
  );

create policy "alunos_write_admin"
  on alunos for all
  to authenticated
  with check (
    (select perfil from auth.usuario_context()) = 'ADMIN'
  );

create policy "alunos_write_school"
  on alunos for insert
  to authenticated
  with check (
    (select perfil from auth.usuario_context()) = 'ESCOLA'
    and (select escola_id from auth.usuario_context()) = alunos.escola_id
  );

create policy "alunos_update_school"
  on alunos for update
  to authenticated
  using (
    (select perfil from auth.usuario_context()) = 'ADMIN'
    or
    (select escola_id from auth.usuario_context()) = alunos.escola_id
  )
  with check (
    (select perfil from auth.usuario_context()) = 'ADMIN'
    or
    (select escola_id from auth.usuario_context()) = alunos.escola_id
  );

-- ============================================================
-- TABLE: faltas
-- ============================================================
-- ADMIN: full access to all faltas
-- ESCOLA: can SELECT / INSERT / UPDATE only faltas belonging
--         to alunos of its own escola (enforced via aluno_id -> alunos.escola_id)
create policy "faltas_select_by_school"
  on faltas for select
  using (
    (select perfil from auth.usuario_context()) = 'ADMIN'
    or
    faltas.escola_id = (select escola_id from auth.usuario_context())
  );

create policy "faltas_write_admin"
  on faltas for all
  to authenticated
  with check (
    (select perfil from auth.usuario_context()) = 'ADMIN'
  );

create policy "faltas_write_school"
  on faltas for insert
  to authenticated
  with check (
    (select perfil from auth.usuario_context()) = 'ESCOLA'
    and faltas.escola_id = (select escola_id from auth.usuario_context())
  );

create policy "faltas_update_school"
  on faltas for update
  to authenticated
  using (
    (select perfil from auth.usuario_context()) = 'ADMIN'
    or
    faltas.escola_id = (select escola_id from auth.usuario_context())
  )
  with check (
    (select perfil from auth.usuario_context()) = 'ADMIN'
    or
    faltas.escola_id = (select escola_id from auth.usuario_context())
  );

-- ============================================================
-- TABLE: envios_faltas
-- ============================================================
create policy "envios_select_by_school"
  on envios_faltas for select
  using (
    (select perfil from auth.usuario_context()) = 'ADMIN'
    or
    envios_faltas.escola_id = (select escola_id from auth.usuario_context())
  );

create policy "envios_write_admin"
  on envios_faltas for all
  to authenticated
  with check (
    (select perfil from auth.usuario_context()) = 'ADMIN'
  );

create policy "envios_write_school"
  on envios_faltas for insert
  to authenticated
  with check (
    (select perfil from auth.usuario_context()) = 'ESCOLA'
    and envios_faltas.escola_id = (select escola_id from auth.usuario_context())
  );

create policy "envios_update_school"
  on envios_faltas for update
  to authenticated
  using (
    (select perfil from auth.usuario_context()) = 'ADMIN'
    or
    envios_faltas.escola_id = (select escola_id from auth.usuario_context())
  )
  with check (
    (select perfil from auth.usuario_context()) = 'ADMIN'
    or
    envios_faltas.escola_id = (select escola_id from auth.usuario_context())
  );

-- ============================================================
-- TABLE: importacoes_pdf
-- ============================================================
create policy "importacoes_select_by_school"
  on importacoes_pdf for select
  using (
    (select perfil from auth.usuario_context()) = 'ADMIN'
    or
    importacoes_pdf.escola_id = (select escola_id from auth.usuario_context())
  );

create policy "importacoes_write_admin"
  on importacoes_pdf for all
  to authenticated
  with check (
    (select perfil from auth.usuario_context()) = 'ADMIN'
  );

-- ============================================================
-- Trigger: updated_at auto-refresh on row update
-- ============================================================
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_escolas_updated
  before update on escolas
  for each row execute function set_updated_at();

create trigger trg_usuarios_updated
  before update on usuarios
  for each row execute function set_updated_at();

create trigger trg_alunos_updated
  before update on alunos
  for each row execute function set_updated_at();

create trigger trg_faltas_updated
  before update on faltas
  for each row execute function set_updated_at();

create trigger trg_envios_updated
  before update on envios_faltas
  for each row execute function set_updated_at();
