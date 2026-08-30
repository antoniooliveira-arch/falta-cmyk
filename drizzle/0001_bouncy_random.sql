CREATE TABLE `alunos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`escolaId` int NOT NULL,
	`nome` varchar(220) NOT NULL,
	`inep` varchar(30),
	`turma` varchar(100) NOT NULL,
	`matricula` varchar(50) NOT NULL,
	`dataMatricula` varchar(10),
	`filiacao1` varchar(220),
	`filiacao2` varchar(220),
	`responsavel` varchar(220),
	`fone1` varchar(30),
	`fone2` varchar(30),
	`endereco` text,
	`ativo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alunos_id` PRIMARY KEY(`id`),
	CONSTRAINT `alunos_escola_matricula_unique` UNIQUE(`escolaId`,`matricula`),
	CONSTRAINT `alunos_escola_inep_unique` UNIQUE(`escolaId`,`inep`)
);
--> statement-breakpoint
CREATE TABLE `envios_faltas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`escolaId` int NOT NULL,
	`usuarioId` int NOT NULL,
	`periodo` varchar(80) NOT NULL,
	`observacao` text,
	`status` enum('RASCUNHO','ENVIADO','EM_ANALISE','APROVADO','REJEITADO') NOT NULL DEFAULT 'RASCUNHO',
	`enviadoEm` timestamp,
	`analisadoEm` timestamp,
	`analisadoPor` int,
	`observacaoAdmin` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `envios_faltas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `escolas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(180) NOT NULL,
	`codigo` varchar(30) NOT NULL,
	`ativo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `escolas_id` PRIMARY KEY(`id`),
	CONSTRAINT `escolas_codigo_unique` UNIQUE(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `faltas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoId` int NOT NULL,
	`escolaId` int NOT NULL,
	`dataFalta` varchar(10) NOT NULL,
	`quantidadeDias` int NOT NULL,
	`motivo` varchar(160) NOT NULL,
	`observacao` text,
	`registradoPor` int NOT NULL,
	`status` enum('RASCUNHO','ENVIADO','EM_ANALISE','APROVADO','REJEITADO') NOT NULL DEFAULT 'RASCUNHO',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `faltas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `importacoes_pdf` (
	`id` int AUTO_INCREMENT NOT NULL,
	`escolaId` int,
	`usuarioId` int NOT NULL,
	`nomeArquivo` varchar(255) NOT NULL,
	`totalPaginas` int NOT NULL DEFAULT 0,
	`totalAlunos` int NOT NULL DEFAULT 0,
	`status` varchar(40) NOT NULL,
	`erros` text,
	`avisos` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `importacoes_pdf_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authUserId` int NOT NULL,
	`nome` varchar(180) NOT NULL,
	`email` varchar(320) NOT NULL,
	`perfil` enum('ADMIN','ESCOLA') NOT NULL,
	`escolaId` int,
	`ativo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usuarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `usuarios_auth_user_unique` UNIQUE(`authUserId`)
);
--> statement-breakpoint
CREATE INDEX `alunos_escola_idx` ON `alunos` (`escolaId`);--> statement-breakpoint
CREATE INDEX `alunos_turma_idx` ON `alunos` (`turma`);--> statement-breakpoint
CREATE INDEX `alunos_nome_idx` ON `alunos` (`nome`);--> statement-breakpoint
CREATE INDEX `alunos_matricula_idx` ON `alunos` (`matricula`);--> statement-breakpoint
CREATE INDEX `envios_escola_idx` ON `envios_faltas` (`escolaId`);--> statement-breakpoint
CREATE INDEX `envios_status_idx` ON `envios_faltas` (`status`);--> statement-breakpoint
CREATE INDEX `faltas_aluno_idx` ON `faltas` (`alunoId`);--> statement-breakpoint
CREATE INDEX `faltas_escola_idx` ON `faltas` (`escolaId`);--> statement-breakpoint
CREATE INDEX `faltas_data_idx` ON `faltas` (`dataFalta`);--> statement-breakpoint
CREATE INDEX `importacoes_escola_idx` ON `importacoes_pdf` (`escolaId`);--> statement-breakpoint
CREATE INDEX `usuarios_escola_idx` ON `usuarios` (`escolaId`);