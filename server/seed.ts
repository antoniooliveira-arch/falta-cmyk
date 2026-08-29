import { drizzle } from "drizzle-orm/node-postgres";
import { escolas, usuarios, users } from "../drizzle/schema";
import { hashPassword } from "./_core/password";
import { ENV } from "./_core/env";

const ESCOLAS = [
  { nome: "CEI LUIZ FELIPE", codigo: "CEI-LF" },
  { nome: "CEM SAO CRISTOVAO", codigo: "CEM-SC" },
  { nome: "CEI ARCO IRIS", codigo: "CEI-AI" },
  { nome: "CEI BRUNO LEONARDO", codigo: "CEI-BL" },
  { nome: "CEI DOM FRANCO", codigo: "CEI-DF" },
  { nome: "CEI MENINO JESUS", codigo: "CEI-MJ" },
  { nome: "CEI NOSSO LAR", codigo: "CEI-NL" },
  { nome: "CEI VASCO PAPA", codigo: "CEI-VP" },
  { nome: "CEI CRIANÇA FELIZ", codigo: "CEI-CF" },
  { nome: "CEM GUILHERME", codigo: "CEM-GU" },
  { nome: "CEM ORLANDO PEREIRA", codigo: "CEM-OP" },
  { nome: "EM MARIA HILDA", codigo: "EM-MH" },
  { nome: "EM PAULO FREIRE", codigo: "EM-PF" },
  { nome: "EM JOSE ANCHIETA", codigo: "EM-JA" },
  { nome: "ERM ALVARES AZEVEDO", codigo: "ERM-AA" },
  { nome: "ERM CORA CORALINA", codigo: "ERM-CC" },
  { nome: "ERM EUCLIDES CUNHA", codigo: "ERM-EC" },
  { nome: "ERM OSVALDO CRUZ", codigo: "ERM-OC" },
  { nome: "ERM VINICIUS DE MORAIS", codigo: "ERM-VM" },
];

const DEFAULT_PASSWORD = "123";

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL não configurada");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);
  console.log("Conectado ao banco de dados");

  for (const escola of ESCOLAS) {
    console.log(`\nProcessando: ${escola.nome}`);

    let school = await db.select().from(escolas).where(eq(escolas.codigo, escola.codigo)).limit(1);
    let escolaId: number;

    if (school[0]) {
      escolaId = school[0].id;
      console.log(`  Escola já existe (ID: ${escolaId})`);
    } else {
      const result = await db.insert(escolas).values({ ...escola, ativo: 1 }).returning({ id: escolas.id });
      escolaId = result[0]!.id;
      console.log(`  Escola criada (ID: ${escolaId})`);
    }

    const email = `${escola.codigo.toLowerCase()}@escola.local`;
    let user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    let userId: number;

    if (user[0]) {
      userId = user[0].id;
      console.log(`  Usuário já existe (ID: ${userId})`);
    } else {
      const passwordHash = await hashPassword(DEFAULT_PASSWORD);
      const result = await db.insert(users).values({
        email,
        name: escola.nome,
        passwordHash,
        loginMethod: "password",
        role: "user",
        mustChangePassword: 1,
      }).returning({ id: users.id });
      userId = result[0]!.id;
      console.log(`  Usuário criado (ID: ${userId})`);
    }

    let businessUser = await db.select().from(usuarios).where(eq(usuarios.authUserId, userId)).limit(1);
    if (!businessUser[0]) {
      await db.insert(usuarios).values({
        authUserId: userId,
        nome: escola.nome,
        email,
        perfil: "ESCOLA",
        escolaId,
        ativo: 1,
      });
      console.log(`  Perfil ESCOLA criado`);
    } else {
      console.log(`  Perfil ESCOLA já existe`);
    }
  }

  console.log("\n✅ Seed concluído!");
  console.log("\nCredenciais de acesso:");
  console.log("Senha padrão para todas as escolas: 123");
  console.log("\nExemplos:");
  for (const escola of ESCOLAS.slice(0, 3)) {
    console.log(`  ${escola.nome}: ${escola.codigo.toLowerCase()}@escola.local / 123`);
  }
  console.log("  ...");
  process.exit(0);
}

import { eq } from "drizzle-orm";
seed().catch((err) => {
  console.error("Erro no seed:", err);
  process.exit(1);
});