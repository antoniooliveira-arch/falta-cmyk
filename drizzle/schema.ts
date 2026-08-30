import { check, integer, pgEnum, pgTable, text, timestamp, varchar, uniqueIndex, index, serial } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const perfilEnum = pgEnum("perfil", ["ADMIN", "ESCOLA"]);
export const ficaiParticipaEnum = pgEnum("ficai_participa", ["SIM", "NAO"]);
export const statusEnum = pgEnum("status", ["RASCUNHO", "ENVIADO", "EM_ANALISE", "APROVADO", "REJEITADO"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).unique(),
  username: varchar("username", { length: 180 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  mustChangePassword: integer("must_change_password").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export const escolas = pgTable("escolas", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 180 }).notNull(),
  codigo: varchar("codigo", { length: 30 }).notNull().unique(),
  ativo: integer("ativo").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  authUserId: integer("authUserId").notNull().references(() => users.id),
  nome: varchar("nome", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  perfil: perfilEnum("perfil").notNull(),
  escolaId: integer("escola_id").references(() => escolas.id),
  ativo: integer("ativo").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  authUserUnique: uniqueIndex("usuarios_auth_user_unique").on(table.authUserId),
  escolaIndex: index("usuarios_escola_idx").on(table.escolaId),
  roleSchoolCheck: check("usuarios_perfil_escola_check", sql`perfil = 'ADMIN' OR escola_id IS NOT NULL`),
}));

export const alunos = pgTable("alunos", {
  id: serial("id").primaryKey(),
  escolaId: integer("escola_id").notNull().references(() => escolas.id),
  nome: varchar("nome", { length: 220 }).notNull(),
  inep: varchar("inep", { length: 30 }),
  turma: varchar("turma", { length: 100 }).notNull(),
  matricula: varchar("matricula", { length: 50 }).notNull(),
  dataMatricula: varchar("data_matricula", { length: 10 }),
  filiacao1: varchar("filiacao1", { length: 220 }),
  filiacao2: varchar("filiacao2", { length: 220 }),
  responsavel: varchar("responsavel", { length: 220 }),
  fone1: varchar("fone1", { length: 30 }),
  fone2: varchar("fone2", { length: 30 }),
  endereco: text("endereco"),
  ativo: integer("ativo").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, table => ({
  escolaMatriculaUnique: uniqueIndex("alunos_escola_matricula_unique").on(table.escolaId, table.matricula),
  escolaInepUnique: uniqueIndex("alunos_escola_inep_unique").on(table.escolaId, table.inep),
  escolaIndex: index("alunos_escola_idx").on(table.escolaId),
  turmaIndex: index("alunos_turma_idx").on(table.turma),
  nomeIndex: index("alunos_nome_idx").on(table.nome),
  matriculaIndex: index("alunos_matricula_idx").on(table.matricula),
}));

export const faltas = pgTable("faltas", {
  id: serial("id").primaryKey(),
  alunoId: integer("aluno_id").notNull().references(() => alunos.id),
  escolaId: integer("escola_id").notNull().references(() => escolas.id),
  dataFalta: varchar("data_falta", { length: 10 }).notNull(),
  quantidadeDias: integer("quantidade_dias").notNull(),
  motivo: varchar("motivo", { length: 160 }).notNull(),
  observacao: text("observacao"),
  ficaiParticipa: ficaiParticipaEnum("ficai_participa").default("NAO").notNull(),
  envioId: integer("envio_id"),
  registradoPor: integer("registrado_por").notNull().references(() => usuarios.id),
  status: statusEnum("status").default("RASCUNHO").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, table => ({
  alunoIndex: index("faltas_aluno_idx").on(table.alunoId),
  escolaIndex: index("faltas_escola_idx").on(table.escolaId),
  dataIndex: index("faltas_data_idx").on(table.dataFalta),
}));

export const enviosFaltas = pgTable("envios_faltas", {
  id: serial("id").primaryKey(),
  escolaId: integer("escola_id").notNull().references(() => escolas.id),
  usuarioId: integer("usuario_id").notNull().references(() => usuarios.id),
  periodo: varchar("periodo", { length: 80 }).notNull(),
  observacao: text("observacao"),
  status: statusEnum("status").default("RASCUNHO").notNull(),
  enviadoEm: timestamp("enviado_em"),
  analisadoEm: timestamp("analisado_em"),
  analisadoPor: integer("analisado_por").references(() => usuarios.id),
  observacaoAdmin: text("observacao_admin"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  escolaIndex: index("envios_escola_idx").on(table.escolaId),
  statusIndex: index("envios_status_idx").on(table.status),
}));

export const importacoesPdf = pgTable("importacoes_pdf", {
  id: serial("id").primaryKey(),
  escolaId: integer("escola_id").references(() => escolas.id),
  usuarioId: integer("usuario_id").notNull().references(() => usuarios.id),
  nomeArquivo: varchar("nome_arquivo", { length: 255 }).notNull(),
  totalPaginas: integer("total_paginas").default(0).notNull(),
  totalAlunos: integer("total_alunos").default(0).notNull(),
  status: varchar("status", { length: 40 }).notNull(),
  erros: text("erros"),
  avisos: text("avisos"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  escolaIndex: index("importacoes_escola_idx").on(table.escolaId),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Escola = typeof escolas.$inferSelect;
export type Aluno = typeof alunos.$inferSelect;
export type Falta = typeof faltas.$inferSelect;
export type EnvioFalta = typeof enviosFaltas.$inferSelect;