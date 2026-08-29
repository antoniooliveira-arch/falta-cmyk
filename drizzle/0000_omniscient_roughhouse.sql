CREATE TYPE "public"."ficai_participa" AS ENUM('SIM', 'NAO');--> statement-breakpoint
CREATE TYPE "public"."perfil" AS ENUM('ADMIN', 'ESCOLA');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('RASCUNHO', 'ENVIADO', 'EM_ANALISE', 'APROVADO', 'REJEITADO');--> statement-breakpoint
CREATE TABLE "alunos" (
	"id" serial PRIMARY KEY NOT NULL,
	"escolaId" integer NOT NULL,
	"nome" varchar(220) NOT NULL,
	"inep" varchar(30),
	"turma" varchar(100) NOT NULL,
	"matricula" varchar(50) NOT NULL,
	"dataMatricula" varchar(10),
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
	"escolaId" integer NOT NULL,
	"usuarioId" integer NOT NULL,
	"periodo" varchar(80) NOT NULL,
	"observacao" text,
	"status" "status" DEFAULT 'RASCUNHO' NOT NULL,
	"enviadoEm" timestamp,
	"analisadoEm" timestamp,
	"analisadoPor" integer,
	"observacaoAdmin" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "escolas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(180) NOT NULL,
	"codigo" varchar(30) NOT NULL,
	"ativo" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "escolas_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "faltas" (
	"id" serial PRIMARY KEY NOT NULL,
	"alunoId" integer NOT NULL,
	"escolaId" integer NOT NULL,
	"dataFalta" varchar(10) NOT NULL,
	"quantidadeDias" integer NOT NULL,
	"motivo" varchar(160) NOT NULL,
	"observacao" text,
	"ficai_participa" "ficai_participa" DEFAULT 'NAO' NOT NULL,
	"envioId" integer,
	"registradoPor" integer NOT NULL,
	"status" "status" DEFAULT 'RASCUNHO' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "importacoes_pdf" (
	"id" serial PRIMARY KEY NOT NULL,
	"escolaId" integer,
	"usuarioId" integer NOT NULL,
	"nomeArquivo" varchar(255) NOT NULL,
	"totalPaginas" integer DEFAULT 0 NOT NULL,
	"totalAlunos" integer DEFAULT 0 NOT NULL,
	"status" varchar(40) NOT NULL,
	"erros" text,
	"avisos" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"authUserId" integer NOT NULL,
	"nome" varchar(180) NOT NULL,
	"email" varchar(320) NOT NULL,
	"perfil" "perfil" NOT NULL,
	"escolaId" integer,
	"ativo" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_perfil_escola_check" CHECK (perfil = 'ADMIN' OR escolaId IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_escolaId_escolas_id_fk" FOREIGN KEY ("escolaId") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios_faltas" ADD CONSTRAINT "envios_faltas_escolaId_escolas_id_fk" FOREIGN KEY ("escolaId") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios_faltas" ADD CONSTRAINT "envios_faltas_usuarioId_usuarios_id_fk" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios_faltas" ADD CONSTRAINT "envios_faltas_analisadoPor_usuarios_id_fk" FOREIGN KEY ("analisadoPor") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faltas" ADD CONSTRAINT "faltas_alunoId_alunos_id_fk" FOREIGN KEY ("alunoId") REFERENCES "public"."alunos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faltas" ADD CONSTRAINT "faltas_escolaId_escolas_id_fk" FOREIGN KEY ("escolaId") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faltas" ADD CONSTRAINT "faltas_registradoPor_usuarios_id_fk" FOREIGN KEY ("registradoPor") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "importacoes_pdf" ADD CONSTRAINT "importacoes_pdf_escolaId_escolas_id_fk" FOREIGN KEY ("escolaId") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "importacoes_pdf" ADD CONSTRAINT "importacoes_pdf_usuarioId_usuarios_id_fk" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_authUserId_users_id_fk" FOREIGN KEY ("authUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_escolaId_escolas_id_fk" FOREIGN KEY ("escolaId") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alunos_escola_matricula_unique" ON "alunos" USING btree ("escolaId","matricula");--> statement-breakpoint
CREATE UNIQUE INDEX "alunos_escola_inep_unique" ON "alunos" USING btree ("escolaId","inep");--> statement-breakpoint
CREATE INDEX "alunos_escola_idx" ON "alunos" USING btree ("escolaId");--> statement-breakpoint
CREATE INDEX "alunos_turma_idx" ON "alunos" USING btree ("turma");--> statement-breakpoint
CREATE INDEX "alunos_nome_idx" ON "alunos" USING btree ("nome");--> statement-breakpoint
CREATE INDEX "alunos_matricula_idx" ON "alunos" USING btree ("matricula");--> statement-breakpoint
CREATE INDEX "envios_escola_idx" ON "envios_faltas" USING btree ("escolaId");--> statement-breakpoint
CREATE INDEX "envios_status_idx" ON "envios_faltas" USING btree ("status");--> statement-breakpoint
CREATE INDEX "faltas_aluno_idx" ON "faltas" USING btree ("alunoId");--> statement-breakpoint
CREATE INDEX "faltas_escola_idx" ON "faltas" USING btree ("escolaId");--> statement-breakpoint
CREATE INDEX "faltas_data_idx" ON "faltas" USING btree ("dataFalta");--> statement-breakpoint
CREATE INDEX "importacoes_escola_idx" ON "importacoes_pdf" USING btree ("escolaId");--> statement-breakpoint
CREATE UNIQUE INDEX "usuarios_auth_user_unique" ON "usuarios" USING btree ("authUserId");--> statement-breakpoint
CREATE INDEX "usuarios_escola_idx" ON "usuarios" USING btree ("escolaId");