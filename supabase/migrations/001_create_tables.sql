-- ============================================================
-- Migration 1: Create core tables, foreign keys, indexes, constraints
-- ============================================================

-- ============================================================
-- Tabela: escolas (Schools)
-- ============================================================
create table escolas (
  id          bigint generated always as identity primary key,
  nome        varchar(180) not null,
  codigo      varchar(30)  not null unique,
  ativo       boolean      not null default true,
  created_at  timestamp    not null default now(),
  updated_at  timestamp    not null default now()
);

create index idx_escolas_ativo on escolas (ativo);

-- ============================================================
-- Tabela: usuarios (Business user profiles linked to Supabase Auth)
-- ============================================================
-- auth_user_id references the UUID from auth.users (Supabase Auth)
create table usuarios (
  id            bigint generated always as identity primary key,
  auth_user_id  uuid          not null references auth.users on delete cascade,
  nome          varchar(180)  not null,
  email         varchar(320)  not null unique,
  perfil        varchar(20)   not null check (perfil in ('ADMIN', 'ESCOLA')),
  escola_id     bigint        references escolas (id) on delete set null,
  ativo         boolean       not null default true,
  created_at    timestamp     not null default now(),
  updated_at    timestamp     not null default now(),
  -- Regras:
  --   ADMIN   -> escola_id pode ser NULL (acesso a todas as escolas)
  --   ESCOLA  -> escola_id obrigatório
  constraint usuarios_perfil_check
    check (
      (perfil = 'ADMIN') or
      (perfil = 'ESCOLA' and escola_id is not null)
    )
);

create unique index idx_usuarios_auth_user_id on usuarios (auth_user_id);
create unique index idx_usuarios_email        on usuarios (email);
create index idx_usuarios_escola_id          on usuarios (escola_id);
create index idx_usuarios_perfil             on usuarios (perfil);

-- ============================================================
-- Tabela: alunos (Students)
-- ============================================================
create table alunos (
  id             bigint generated always as identity primary key,
  escola_id      bigint      not null references escolas (id) on delete cascade,
  nome           varchar(220) not null,
  inep           varchar(30),
  turma          varchar(100) not null,
  matricula      varchar(50)  not null,
  data_matricula varchar(10),          -- stored as YYYY-MM-DD text
  filiacao1      varchar(220),
  filiacao2      varchar(220),
  responsavel    varchar(220),
  fone1          varchar(30),
  fone2          varchar(30),
  endereco       text,
  ativo          boolean     not null default true,
  created_at     timestamp   not null default now(),
  updated_at     timestamp   not null default now(),

  -- Evitar duplicidade: escola_id + matricula
  constraint alunos_escola_matricula_unique
    unique (escola_id, matricula),

  -- Evitar duplicidade: escola_id + inep (quando INEP informado)
  constraint alunos_escola_inep_unique
    unique (escola_id, inep)
);

create index idx_alunos_escola_id  on alunos (escola_id);
create index idx_alunos_turma      on alunos (turma);
create index idx_alunos_nome       on alunos (nome);
create index idx_alunos_matricula  on alunos (matricula);

-- ============================================================
-- Tabela: faltas (Absences)
-- ============================================================
create type status_falta as enum ('RASCUNHO', 'ENVIADO', 'EM_ANALISE', 'APROVADO', 'REJEITADO');
create type ficai_participa as enum ('SIM', 'NAO');

create table faltas (
  id            bigint generated always as identity primary key,
  aluno_id      bigint       not null references alunos (id) on delete cascade,
  escola_id     bigint       not null references escolas (id) on delete cascade,
  data_falta    date         not null,
  quantidade_dias integer    not null default 1 check (quantidade_dias >= 1),
  motivo        varchar(160) not null,
  observacao    text,
  ficai_participa ficai_participa not null default 'NAO',
  envio_id      bigint,       -- FK adicionado depois (referencia importacoes_pdf não envios_faltas)
  registrado_por bigint      not null references usuarios (id) on delete set null,
  status        status_falta not null default 'RASCUNHO',
  created_at    timestamp    not null default now(),
  updated_at    timestamp    not null default now()
);

create index idx_faltas_aluno_id   on faltas (aluno_id);
create index idx_faltas_escola_id  on faltas (escola_id);
create index idx_faltas_data       on faltas (data_falta);
create index idx_faltas_status     on faltas (status);
create index idx_faltas_envio_id   on faltas (envio_id);

-- FK para enviros_faltas adicionada na migration 2 (evita forward-reference)

-- ============================================================
-- Tabela: envios_faltas (Absence submissions sent by schools)
-- ============================================================
create type status_envio as enum ('RASCUNHO', 'ENVIADO', 'EM_ANALISE', 'APROVADO', 'REJEITADO');

create table envios_faltas (
  id            bigint generated always as identity primary key,
  escola_id     bigint      not null references escolas (id) on delete cascade,
  usuario_id    bigint      not null references usuarios (id) on delete set null,
  periodo       varchar(80) not null,      -- e.g. "Agosto/2026"
  observacao    text,
  status        status_envio not null default 'RASCUNHO',
  enviado_em      timestamp,
  analisado_em    timestamp,
  analisado_por   bigint references usuarios (id) on delete set null,
  observacao_admin text,
  created_at    timestamp     not null default now(),
  updated_at    timestamp     not null default now()
);

create index idx_envios_escola_id  on envios_faltas (escola_id);
create index idx_envios_status     on envios_faltas (status);
create index idx_envios_usuario_id on envios_faltas (usuario_id);

-- FK envio_id -> envios_faltas.id
alter table faltas
  add constraint faltas_envio_id_fkey
  foreign key (envio_id) references envios_faltas (id)
  on delete set null;

-- ============================================================
-- Tabela: importacoes_pdf (PDF import logs)
-- ============================================================
create type status_importacao as enum ('PROCESSANDO', 'CONCLUIDA', 'CONCLUIDA_COM_AVISOS', 'ERRO');

create table importacoes_pdf (
  id               bigint generated always as identity primary key,
  escola_id        bigint references escolas (id) on delete set null,
  usuario_id       bigint not null references usuarios (id) on delete set null,
  nome_arquivo     varchar(255) not null,
  total_paginas    integer      not null default 0,
  total_alunos     integer      not null default 0,
  alunos_importados integer     not null default 0,
  alunos_duplicados integer     not null default 0,
  alunos_com_erro   integer     not null default 0,
  status           status_importacao not null default 'PROCESSANDO',
  erros            text,
  avisos           text,
  created_at       timestamp not null default now()
);

create index idx_importacoes_escola_id   on importacoes_pdf (escola_id);
create index idx_importacoes_status      on importacoes_pdf (status);
create index idx_importacoes_usuario_id  on importacoes_pdf (usuario_id);
