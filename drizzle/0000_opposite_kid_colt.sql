CREATE TYPE "public"."ficai_participa" AS ENUM('SIM', 'NAO');--> statement-breakpoint
CREATE TYPE "public"."perfil" AS ENUM('ADMIN', 'ESCOLA');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('RASCUNHO', 'ENVIADO', 'EM_ANALISE', 'APROVADO', 'REJEITADO');--> statement-breakpoint
CREATE TABLE "alunos" (
	"id" serial PRIMARY KEY NOT NULL,
	"escola_id" integer NOT NULL,
	"nome" varchar(220) NOT NULL,
	"inep" varchar(30),
	"turma" varchar(100) NOT NULL,
	"matricula" varchar(50) NOT NULL,
	"data_matricula" varchar(10),
	"filiacao1" varchar(220),
	"filiacao2" varchar(220),
	"responsavel" varchar(220),
	"fone1" varchar(30),
	"fone2" varchar(30),
	"endereco" text,
	"ativo" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "envios_faltas" (
	"id" serial PRIMARY KEY NOT NULL,
	"escola_id" integer NOT NULL,
	"usuario_id" integer NOT NULL,
	"periodo" varchar(80) NOT NULL,
	"observacao" text,
	"status" "status" DEFAULT 'RASCUNHO' NOT NULL,
	"enviado_em" timestamp,
	"analisado_em" timestamp,
	"analisado_por" integer,
	"observacao_admin" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "escolas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(180) NOT NULL,
	"codigo" varchar(30) NOT NULL,
	"ativo" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "escolas_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "faltas" (
	"id" serial PRIMARY KEY NOT NULL,
	"aluno_id" integer NOT NULL,
	"escola_id" integer NOT NULL,
	"data_falta" varchar(10) NOT NULL,
	"quantidade_dias" integer NOT NULL,
	"motivo" varchar(160) NOT NULL,
	"observacao" text,
	"ficai_participa" "ficai_participa" DEFAULT 'NAO' NOT NULL,
	"envio_id" integer,
	"registrado_por" integer NOT NULL,
	"status" "status" DEFAULT 'RASCUNHO' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "importacoes_pdf" (
	"id" serial PRIMARY KEY NOT NULL,
	"escola_id" integer,
	"usuario_id" integer NOT NULL,
	"nome_arquivo" varchar(255) NOT NULL,
	"total_paginas" integer DEFAULT 0 NOT NULL,
	"total_alunos" integer DEFAULT 0 NOT NULL,
	"status" varchar(40) NOT NULL,
	"erros" text,
	"avisos" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"open_id" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"login_method" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_signed_in" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_open_id_unique" UNIQUE("open_id")
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"authUserId" integer NOT NULL,
	"nome" varchar(180) NOT NULL,
	"email" varchar(320) NOT NULL,
	"perfil" "perfil" NOT NULL,
	"escola_id" integer,
	"ativo" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_perfil_escola_check" CHECK (perfil = 'ADMIN' OR escola_id IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_escola_id_escolas_id_fk" FOREIGN KEY ("escola_id") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios_faltas" ADD CONSTRAINT "envios_faltas_escola_id_escolas_id_fk" FOREIGN KEY ("escola_id") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios_faltas" ADD CONSTRAINT "envios_faltas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios_faltas" ADD CONSTRAINT "envios_faltas_analisado_por_usuarios_id_fk" FOREIGN KEY ("analisado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faltas" ADD CONSTRAINT "faltas_aluno_id_alunos_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."alunos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faltas" ADD CONSTRAINT "faltas_escola_id_escolas_id_fk" FOREIGN KEY ("escola_id") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faltas" ADD CONSTRAINT "faltas_registrado_por_usuarios_id_fk" FOREIGN KEY ("registrado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "importacoes_pdf" ADD CONSTRAINT "importacoes_pdf_escola_id_escolas_id_fk" FOREIGN KEY ("escola_id") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "importacoes_pdf" ADD CONSTRAINT "importacoes_pdf_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_authUserId_users_id_fk" FOREIGN KEY ("authUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_escola_id_escolas_id_fk" FOREIGN KEY ("escola_id") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alunos_escola_matricula_unique" ON "alunos" USING btree ("escola_id","matricula");--> statement-breakpoint
CREATE UNIQUE INDEX "alunos_escola_inep_unique" ON "alunos" USING btree ("escola_id","inep");--> statement-breakpoint
CREATE INDEX "alunos_escola_idx" ON "alunos" USING btree ("escola_id");--> statement-breakpoint
CREATE INDEX "alunos_turma_idx" ON "alunos" USING btree ("turma");--> statement-breakpoint
CREATE INDEX "alunos_nome_idx" ON "alunos" USING btree ("nome");--> statement-breakpoint
CREATE INDEX "alunos_matricula_idx" ON "alunos" USING btree ("matricula");--> statement-breakpoint
CREATE INDEX "envios_escola_idx" ON "envios_faltas" USING btree ("escola_id");--> statement-breakpoint
CREATE INDEX "envios_status_idx" ON "envios_faltas" USING btree ("status");--> statement-breakpoint
CREATE INDEX "faltas_aluno_idx" ON "faltas" USING btree ("aluno_id");--> statement-breakpoint
CREATE INDEX "faltas_escola_idx" ON "faltas" USING btree ("escola_id");--> statement-breakpoint
CREATE INDEX "faltas_data_idx" ON "faltas" USING btree ("data_falta");--> statement-breakpoint
CREATE INDEX "importacoes_escola_idx" ON "importacoes_pdf" USING btree ("escola_id");--> statement-breakpoint
CREATE UNIQUE INDEX "usuarios_auth_user_unique" ON "usuarios" USING btree ("authUserId");--> statement-breakpoint
CREATE INDEX "usuarios_escola_idx" ON "usuarios" USING btree ("escola_id");