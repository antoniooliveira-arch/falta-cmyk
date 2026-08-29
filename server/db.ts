import { and, count, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { InsertUser, alunos, escolas, enviosFaltas, faltas, importacoesPdf, usuarios, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
    }
  }
  return _db;
}
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, name: user.name, email: user.email, loginMethod: user.loginMethod, lastSignedIn: user.lastSignedIn ?? new Date(), role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user") };
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: { name: values.name, email: values.email, loginMethod: values.loginMethod, lastSignedIn: values.lastSignedIn, role: values.role } });
}
export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}
export async function getBusinessUser(authUserId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(usuarios).where(eq(usuarios.authUserId, authUserId)).limit(1);
  return result[0];
}
export async function getOverview(escolaId?: number) {
  const db = await getDb();
  if (!db) return { schools: 0, students: 0, absences: 0, ficai: 0, pending: 0, submissions: 0, analyzed: 0 };
  const schoolWhere = escolaId ? eq(escolas.id, escolaId) : eq(escolas.ativo, 1);
  const studentWhere = escolaId ? eq(alunos.escolaId, escolaId) : eq(alunos.ativo, 1);
  const absenceWhere = escolaId ? eq(faltas.escolaId, escolaId) : undefined;
  const submissionWhere = escolaId ? eq(enviosFaltas.escolaId, escolaId) : undefined;
  const [schoolRows, studentRows, absenceRows, ficaiRows, pendingRows, submissionRows, analyzedRows] = await Promise.all([
    db.select({ value: count() }).from(escolas).where(schoolWhere),
    db.select({ value: count() }).from(alunos).where(studentWhere),
    db.select({ value: count() }).from(faltas).where(absenceWhere),
    db.select({ value: count() }).from(faltas).where(and(absenceWhere, eq(faltas.ficaiParticipa, "SIM"))),
    db.select({ value: count() }).from(enviosFaltas).where(and(submissionWhere, sql`${enviosFaltas.status} in ('ENVIADO','EM_ANALISE')`)),
    db.select({ value: count() }).from(enviosFaltas).where(and(submissionWhere, eq(enviosFaltas.status, "ENVIADO"))),
    db.select({ value: count() }).from(enviosFaltas).where(and(submissionWhere, sql`${enviosFaltas.status} in ('APROVADO','REJEITADO')`))
  ]);
  return { schools: Number(schoolRows[0]?.value ?? 0), students: Number(studentRows[0]?.value ?? 0), absences: Number(absenceRows[0]?.value ?? 0), ficai: Number(ficaiRows[0]?.value ?? 0), pending: Number(pendingRows[0]?.value ?? 0), submissions: Number(submissionRows[0]?.value ?? 0), analyzed: Number(analyzedRows[0]?.value ?? 0) };
}
export async function listSchools() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: escolas.id, nome: escolas.nome, codigo: escolas.codigo, ativo: escolas.ativo, alunos: count(alunos.id) }).from(escolas).leftJoin(alunos, eq(alunos.escolaId, escolas.id)).groupBy(escolas.id).orderBy(escolas.nome);
}
export async function listStudents(escolaId?: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(alunos).where(escolaId ? eq(alunos.escolaId, escolaId) : undefined).orderBy(alunos.turma, alunos.nome);
}
export async function updateStudent(input: { id: number; nome: string; turma: string; responsavel?: string; fone1?: string; fone2?: string; endereco?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.update(alunos).set({ nome: input.nome, turma: input.turma, responsavel: input.responsavel || null, fone1: input.fone1 || null, fone2: input.fone2 || null, endereco: input.endereco || null }).where(eq(alunos.id, input.id));
}
export async function createAbsence(input: { alunoId: number; escolaId: number; dataFalta: string; quantidadeDias: number; motivo: string; observacao?: string; ficaiParticipa: "SIM" | "NAO"; registradoPor: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const student = await db.select({ id: alunos.id, escolaId: alunos.escolaId }).from(alunos).where(eq(alunos.id, input.alunoId)).limit(1);
  if (!student[0] || student[0].escolaId !== input.escolaId) throw new Error("Aluno não pertence à escola informada");
  const result = await db.insert(faltas).values({ ...input, status: "RASCUNHO" });
  return result[0]?.insertId;
}
export async function listSubmissions(escolaId?: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: enviosFaltas.id, escolaId: enviosFaltas.escolaId, periodo: enviosFaltas.periodo, status: enviosFaltas.status, enviadoEm: enviosFaltas.enviadoEm, observacao: enviosFaltas.observacao, observacaoAdmin: enviosFaltas.observacaoAdmin, escola: escolas.nome }).from(enviosFaltas).leftJoin(escolas, eq(enviosFaltas.escolaId, escolas.id)).where(escolaId ? eq(enviosFaltas.escolaId, escolaId) : undefined).orderBy(desc(enviosFaltas.createdAt));
}
export function normalizePeriod(periodo: string) {
  const value = periodo.trim().toLowerCase();
  const match = value.match(/^(20\d{2})-(0[1-9]|1[0-2])$/);
  if (match) return `${match[1]}-${match[2]}`;
  const year = value.match(/20\d{2}/)?.[0];
  const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const month = months.findIndex(name => value.includes(name));
  if (!year || month < 0) return null;
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function periodToPattern(periodo: string) { return normalizePeriod(periodo); }

export async function createSubmission(input: { escolaId: number; usuarioId: number; periodo: string; observacao?: string }, database?: any) {
  const db = database ?? await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(enviosFaltas).values({ ...input, status: "ENVIADO", enviadoEm: new Date() });
  const envioId = result[0]?.insertId;
  const periodPattern = periodToPattern(input.periodo);
  if (envioId && periodPattern) await db.update(faltas).set({ envioId: Number(envioId), status: "ENVIADO" }).where(and(eq(faltas.escolaId, input.escolaId), eq(faltas.status, "RASCUNHO"), sql`${faltas.dataFalta} like ${periodPattern}`));
  return envioId;
}
export async function getSchoolByName(nome: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(escolas).where(eq(escolas.nome, nome)).limit(1);
  return result[0];
}
export async function confirmStudentImport(input: { escolaId: number; students: Array<{ nome: string; inep?: string; turma: string; matricula: string; dataMatricula?: string; filiacao1?: string; filiacao2?: string; responsavel?: string; fone1?: string; fone2?: string; endereco?: string }> }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select({ matricula: alunos.matricula, inep: alunos.inep }).from(alunos).where(eq(alunos.escolaId, input.escolaId));
  const matriculas = new Set(existing.map(item => item.matricula));
  const inepps = new Set(existing.map(item => item.inep).filter(Boolean));
  const fresh = input.students.filter(student => student.nome && student.turma && student.matricula && !matriculas.has(student.matricula) && (!student.inep || !inepps.has(student.inep)));
  if (fresh.length) await db.insert(alunos).values(fresh.map(student => ({ ...student, escolaId: input.escolaId, inep: student.inep || null, dataMatricula: student.dataMatricula || null, filiacao1: student.filiacao1 || null, filiacao2: student.filiacao2 || null, responsavel: student.responsavel || null, fone1: student.fone1 || null, fone2: student.fone2 || null, endereco: student.endereco || null })));
  return { inserted: fresh.length, skipped: input.students.length - fresh.length };
}
export function resolveBusinessUsername(input: { perfil: "ADMIN" | "ESCOLA"; schoolName?: string; fallback: string }) {
  return input.perfil === "ESCOLA" && input.schoolName ? input.schoolName : input.fallback;
}

export async function createImportLog(input: { escolaId?: number; usuarioId: number; nomeArquivo: string; totalPaginas: number; totalAlunos: number; status: string; erros?: string; avisos?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.insert(importacoesPdf).values(input);
}
export async function createSchool(input: { nome: string; codigo: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.insert(escolas).values({ ...input, ativo: 1 });
}
export async function updateSchool(input: { id: number; nome: string; codigo: string; ativo?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.update(escolas).set(input).where(eq(escolas.id, input.id));
}
export async function listBusinessUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: usuarios.id, authUserId: usuarios.authUserId, nome: usuarios.nome, email: usuarios.email, perfil: usuarios.perfil, escolaId: usuarios.escolaId, escola: escolas.nome, ativo: usuarios.ativo }).from(usuarios).leftJoin(escolas, eq(usuarios.escolaId, escolas.id)).orderBy(usuarios.nome);
}
export async function createBusinessUser(input: { authUserId: number; nome: string; email: string; perfil: "ADMIN" | "ESCOLA"; escolaId?: number }, database?: any) {
  const db = database ?? await getDb();
  if (!db) throw new Error("Database unavailable");
  if (input.perfil === "ESCOLA" && !input.escolaId) throw new Error("Perfil ESCOLA exige uma unidade vinculada");
  let resolvedName = input.nome;
  if (input.perfil === "ESCOLA" && input.escolaId) {
    const school = await db.select({ nome: escolas.nome }).from(escolas).where(eq(escolas.id, input.escolaId)).limit(1);
    if (!school[0]) throw new Error("Unidade escolar não encontrada");
    resolvedName = resolveBusinessUsername({ perfil: input.perfil, schoolName: school[0].nome, fallback: input.nome });
  }
  return db.insert(usuarios).values({ ...input, nome: resolvedName, escolaId: input.escolaId ?? null, ativo: 1 });
}
export async function listAbsences(filters: { escolaId?: number; alunoId?: number; status?: "RASCUNHO" | "ENVIADO" | "EM_ANALISE" | "APROVADO" | "REJEITADO"; search?: string; period?: string; turma?: string; ficaiParticipa?: "SIM" | "NAO" }) {
  const db = await getDb();
  if (!db) return [];
  const clauses = [filters.escolaId ? eq(faltas.escolaId, filters.escolaId) : undefined, filters.alunoId ? eq(faltas.alunoId, filters.alunoId) : undefined, filters.status ? eq(faltas.status, filters.status) : undefined, filters.search ? sql`${alunos.nome} like ${`%${filters.search}%`}` : undefined, filters.period ? sql`${faltas.dataFalta} like ${`%${filters.period}%`}` : undefined, filters.turma ? sql`${alunos.turma} like ${`%${filters.turma}%`}` : undefined, filters.ficaiParticipa ? eq(faltas.ficaiParticipa, filters.ficaiParticipa) : undefined].filter(Boolean);
  return db.select({ id: faltas.id, alunoId: faltas.alunoId, aluno: alunos.nome, escolaId: faltas.escolaId, turma: alunos.turma, dataFalta: faltas.dataFalta, quantidadeDias: faltas.quantidadeDias, motivo: faltas.motivo, ficaiParticipa: faltas.ficaiParticipa, envioId: faltas.envioId, status: faltas.status, observacao: faltas.observacao }).from(faltas).leftJoin(alunos, eq(faltas.alunoId, alunos.id)).where(clauses.length ? and(...clauses) : undefined).orderBy(desc(faltas.createdAt));
}
export async function reviewSubmission(input: { id: number; status: "APROVADO" | "REJEITADO" | "EM_ANALISE"; analisadoPor: number; observacaoAdmin?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.update(enviosFaltas).set({ status: input.status, analisadoPor: input.analisadoPor, analisadoEm: new Date(), observacaoAdmin: input.observacaoAdmin }).where(eq(enviosFaltas.id, input.id));
}