import { supabase } from "@/lib/supabase";

type Escola = {
  id: number;
  nome: string;
  codigo: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

type Usuario = {
  id: number;
  auth_user_id: string;
  nome: string;
  email: string;
  perfil: "ADMIN" | "ESCOLA";
  escola_id: number | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

type Aluno = {
  id: number;
  escola_id: number;
  nome: string;
  inep: string | null;
  turma: string;
  matricula: string;
  data_matricula: string | null;
  filiacao1: string | null;
  filiacao2: string | null;
  responsavel: string | null;
  fone1: string | null;
  fone2: string | null;
  endereco: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

type Falta = {
  id: number;
  aluno_id: number;
  escola_id: number;
  data_falta: string;
  quantidade_dias: number;
  motivo: string;
  observacao: string | null;
  ficai_participa: "SIM" | "NAO";
  envio_id: number | null;
  registrado_por: number;
  status: "RASCUNHO" | "ENVIADO" | "EM_ANALISE" | "APROVADO" | "REJEITADO";
  created_at: string;
  updated_at: string;
};

type EnvioFalta = {
  id: number;
  escola_id: number;
  usuario_id: number;
  periodo: string;
  observacao: string | null;
  status: "RASCUNHO" | "ENVIADO" | "EM_ANALISE" | "APROVADO" | "REJEITADO";
  enviado_em: string | null;
  analisado_em: string | null;
  analisado_por: number | null;
  observacao_admin: string | null;
  created_at: string;
  updated_at: string;
};

export type { Escola, Usuario, Aluno, Falta, EnvioFalta };

export type FaltaWithAluno = Falta & {
  aluno_nome?: string | null;
  aluno_turma?: string | null;
  aluno_inep?: string | null;
  aluno_matricula?: string | null;
};

export type EnvioFaltaWithEscola = EnvioFalta & {
  escola_nome?: string | null;
};

export type AlunoWithEscola = Aluno & {
  escola_nome?: string | null;
};

export type ImportResult = {
  inserted: number;
  skipped: number;
  duplicates: string[];
};

export type ImportInput = {
  escola: string;
  students: Array<{
    nome: string;
    inep?: string;
    turma: string;
    matricula: string;
    dataMatricula?: string;
    filiacao1?: string;
    filiacao2?: string;
    responsavel?: string;
    fone1?: string;
    fone2?: string;
    endereco?: string;
  }>;
};

function checkError(error: any) {
  if (error) throw error;
}

// ============================================================
// Overview / Dashboard
// ============================================================
export async function getOverview(escolaId?: number) {
  const { count: schoolsCount } = escolaId
    ? await supabase
        .from("escolas")
        .select("id", { count: "exact", head: true })
        .eq("id", escolaId)
    : await supabase
        .from("escolas")
        .select("id", { count: "exact", head: true })
        .eq("ativo", true);

  const { count: studentsCount } = escolaId
    ? await supabase
        .from("alunos")
        .select("id", { count: "exact", head: true })
        .eq("escola_id", escolaId)
    : await supabase
        .from("alunos")
        .select("id", { count: "exact", head: true })
        .eq("ativo", true);

  const { count: absencesCount } = escolaId
    ? await supabase
        .from("faltas")
        .select("id", { count: "exact", head: true })
        .eq("escola_id", escolaId)
    : await supabase.from("faltas").select("id", { count: "exact", head: true });

  const { count: pendingCount } = escolaId
    ? await supabase
        .from("envios_faltas")
        .select("id", { count: "exact", head: true })
        .eq("escola_id", escolaId)
        .in("status", ["ENVIADO", "EM_ANALISE"])
    : await supabase
        .from("envios_faltas")
        .select("id", { count: "exact", head: true })
        .in("status", ["ENVIADO", "EM_ANALISE"]);

  return {
    schools: Number(schoolsCount ?? 0),
    students: Number(studentsCount ?? 0),
    absences: Number(absencesCount ?? 0),
    pending: Number(pendingCount ?? 0),
  };
}

// ============================================================
// Schools
// ============================================================
export async function listSchools(): Promise<Escola[]> {
  const { data, error } = await supabase
    .from("escolas")
    .select("*")
    .eq("ativo", true)
    .order("nome");

  checkError(error);
  return (data ?? []) as Escola[];
}

export async function listAllSchoolsWithStats(): Promise<Array<Escola & { alunos: number; turmas: number; faltas: number }>> {
  const { data: escolasData, error } = await supabase
    .from("escolas")
    .select("*")
    .order("nome") as any;

  checkError(error);

  const result: Array<Escola & { alunos: number; turmas: number; faltas: number }> = [];

  for (const escola of escolasData ?? []) {
    const esc = escola as Escola;
    const { count: alunosCount } = await supabase
      .from("alunos")
      .select("id", { count: "exact", head: true })
      .eq("escola_id", esc.id);

    const { data: alunoTurmas, error: _err2 } = await supabase
      .from("alunos")
      .select("turma")
      .eq("escola_id", esc.id);

    const turmasSet = new Set((alunoTurmas ?? []).map((a: any) => a.turma));

    const { count: faltasCount } = await supabase
      .from("faltas")
      .select("id", { count: "exact", head: true })
      .eq("escola_id", esc.id);

    result.push({
      ...esc,
      alunos: Number(alunosCount ?? 0),
      turmas: turmasSet.size,
      faltas: Number(faltasCount ?? 0),
    });
  }

  return result;
}

export async function createSchool(input: { nome: string; codigo: string }) {
  const { error } = await supabase.from("escolas").insert({
    nome: input.nome,
    codigo: input.codigo,
    ativo: true,
  } as any);

  checkError(error);
}

export async function updateSchool(input: {
  id: number;
  nome: string;
  codigo: string;
  ativo?: boolean;
}) {
  const { error } = await supabase
    .from("escolas")
    .update({ nome: input.nome, codigo: input.codigo, ativo: input.ativo ?? true } as any)
    .eq("id", input.id);

  checkError(error);
}

// ============================================================
// Students
// ============================================================
export async function listStudents(escolaId?: number): Promise<Aluno[]> {
  let query = supabase.from("alunos").select("*");

  if (escolaId) {
    query = query.eq("escola_id", escolaId);
  }

  const { data, error } = await query
    .order("turma")
    .order("nome") as any;

  checkError(error);
  return (data ?? []) as Aluno[];
}

export async function getStudent(id: number): Promise<AlunoWithEscola | null> {
  const { data, error } = await supabase
    .from("alunos")
    .select("*")
    .eq("id", id)
    .maybeSingle() as any;

  checkError(error);
  if (!data) return null;

  const { data: escola } = await supabase
    .from("escolas")
    .select("nome")
    .eq("id", data.escola_id)
    .maybeSingle() as any;

  return {
    ...data,
    escola_nome: escola?.nome ?? null,
  } as AlunoWithEscola;
}

export async function updateStudent(input: {
  id: number;
  nome: string;
  turma: string;
  responsavel?: string;
  fone1?: string;
  fone2?: string;
  endereco?: string;
}) {
  const { error } = await supabase
    .from("alunos")
    .update({
      nome: input.nome,
      turma: input.turma,
      responsavel: input.responsavel ?? null,
      fone1: input.fone1 ?? null,
      fone2: input.fone2 ?? null,
      endereco: input.endereco ?? null,
    } as any)
    .eq("id", input.id);

  checkError(error);
}

// ============================================================
// Absences (Faltas)
// ============================================================
export async function listAbsences(filters: {
  escolaId?: number;
  alunoId?: number;
  status?: string;
  search?: string;
  period?: string;
  turma?: string;
}): Promise<FaltaWithAluno[]> {
  let query = supabase.from("faltas").select("*");

  if (filters.escolaId) {
    query = query.eq("escola_id", filters.escolaId);
  }
  if (filters.alunoId) {
    query = query.eq("aluno_id", filters.alunoId);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.period) {
    query = query.ilike("data_falta", `%${filters.period}%`);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  }) as any;

  checkError(error);

  const result: FaltaWithAluno[] = [];

  for (const f of data ?? []) {
    const falta = f as Falta;
    const { data: aluno } = await supabase
      .from("alunos")
      .select("nome, turma, inep, matricula")
      .eq("id", falta.aluno_id)
      .maybeSingle() as any;

    let matchesSearch = true;
    if (filters.search && aluno) {
      matchesSearch = aluno.nome?.toLowerCase().includes(filters.search.toLowerCase()) ?? false;
    }
    if (filters.turma && aluno) {
      matchesSearch = aluno.turma?.toLowerCase().includes(filters.turma.toLowerCase()) ?? false;
    }

    if (matchesSearch) {
      result.push({
        ...falta,
        aluno_nome: aluno?.nome ?? null,
        aluno_turma: aluno?.turma ?? null,
        aluno_inep: aluno?.inep ?? null,
        aluno_matricula: aluno?.matricula ?? null,
      });
    }
  }

  return result;
}

export async function createAbsence(input: {
  alunoId: number;
  escolaId: number;
  dataFalta: string;
  quantidadeDias: number;
  motivo: string;
  observacao?: string;
  ficaiParticipa?: "SIM" | "NAO";
  registradoPor: number;
}) {
  const { data, error } = await supabase
    .from("faltas")
    .insert({
      aluno_id: input.alunoId,
      escola_id: input.escolaId,
      data_falta: input.dataFalta,
      quantidade_dias: input.quantidadeDias,
      motivo: input.motivo,
      observacao: input.observacao ?? null,
      ficai_participa: input.ficaiParticipa ?? "NAO",
      registrado_por: input.registradoPor,
      status: "RASCUNHO",
    } as any)
    .select() as any;

  checkError(error);
  return data?.[0]?.id;
}

// ============================================================
// Submissions (Envios)
// ============================================================
export async function listSubmissions(escolaId?: number): Promise<EnvioFaltaWithEscola[]> {
  let query = supabase.from("envios_faltas").select("*");

  if (escolaId) {
    query = query.eq("escola_id", escolaId);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  }) as any;

  checkError(error);

  const result: EnvioFaltaWithEscola[] = [];

  for (const envio of data ?? []) {
    const e = envio as EnvioFalta;
    const { data: escola } = await supabase
      .from("escolas")
      .select("nome")
      .eq("id", e.escola_id)
      .maybeSingle() as any;

    result.push({
      ...e,
      escola_nome: escola?.nome ?? null,
    });
  }

  return result;
}

export function normalizePeriod(periodo: string): string | null {
  const value = periodo.trim().toLowerCase();

  const match = value.match(/^(20\d{2})-(0[1-9]|1[0-2])$/);
  if (match) return `${match[1]}-${match[2]}`;

  const year = value.match(/20\d{2}/)?.[0];
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  const month = months.findIndex((name) => value.includes(name));
  if (!year || month < 0) return null;

  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export async function createSubmission(input: {
  escolaId: number;
  usuarioId: number;
  periodo: string;
  observacao?: string;
  faltas: Array<{ id: number; data_falta: string }>;
}): Promise<number> {
  const { data, error } = await supabase
    .from("envios_faltas")
    .insert({
      escola_id: input.escolaId,
      usuario_id: input.usuarioId,
      periodo: input.periodo,
      observacao: input.observacao ?? null,
      status: "ENVIADO",
      enviado_em: new Date().toISOString(),
    } as any)
    .select() as any;

  checkError(error);
  const envioId = data?.[0]?.id;

  if (envioId && input.faltas?.length > 0) {
    const falhaIds = input.faltas.map((f) => f.id);
    const { error: updateError } = await supabase
      .from("faltas")
      .update({ envio_id: envioId, status: "ENVIADO" } as any)
      .in("id", falhaIds);

    checkError(updateError);
  }

  return envioId;
}

export async function reviewSubmission(input: {
  id: number;
  status: "APROVADO" | "REJEITADO" | "EM_ANALISE";
  analisadoPor: number;
  observacaoAdmin?: string;
}) {
  const { error } = await supabase
    .from("envios_faltas")
    .update({
      status: input.status,
      analisado_por: input.analisadoPor,
      analisado_em: new Date().toISOString(),
      observacao_admin: input.observacaoAdmin ?? null,
    } as any)
    .eq("id", input.id);

  checkError(error);
}

// ============================================================
// Users (Business profiles)
// ============================================================
export async function listBusinessUsers(): Promise<Array<Usuario & { escola_nome: string | null }>> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .order("nome") as any;

  checkError(error);

  const result: Array<Usuario & { escola_nome: string | null }> = [];

  for (const u of data ?? []) {
    const usuario = u as Usuario;
    let escolaNome: string | null = null;
    if (usuario.escola_id) {
      const { data: esc } = await supabase
        .from("escolas")
        .select("nome")
        .eq("id", usuario.escola_id)
        .maybeSingle() as any;
      escolaNome = esc?.nome ?? null;
    }
    result.push({ ...usuario, escola_nome: escolaNome });
  }

  return result;
}

export async function createBusinessUser(input: {
  authUserId: string;
  nome: string;
  email: string;
  perfil: "ADMIN" | "ESCOLA";
  escolaId?: number;
}) {
  if (input.perfil === "ESCOLA" && !input.escolaId) {
    throw new Error("Perfil ESCOLA exige uma unidade vinculada.");
  }

  let resolvedNome = input.nome;

  if (input.perfil === "ESCOLA" && input.escolaId) {
    const { data: school, error: schoolError } = await supabase
      .from("escolas")
      .select("nome")
      .eq("id", input.escolaId)
      .maybeSingle() as any;

    checkError(schoolError);
    if (!school) throw new Error("Unidade escolar não encontrada.");
    resolvedNome = school.nome;
  }

  const { error } = await supabase.from("usuarios").insert({
    auth_user_id: input.authUserId,
    nome: resolvedNome,
    email: input.email,
    perfil: input.perfil,
    escola_id: input.escolaId ?? null,
    ativo: true,
  } as any);

  checkError(error);
}

// ============================================================
// PDF Imports
// ============================================================
export async function createImportLog(input: {
  escolaId?: number;
  usuarioId: number;
  nomeArquivo: string;
  totalPaginas: number;
  totalAlunos: number;
  status: string;
  erros?: string;
  avisos?: string;
}) {
  const { error } = await supabase.from("importacoes_pdf").insert({
    escola_id: input.escolaId ?? null,
    usuario_id: input.usuarioId,
    nome_arquivo: input.nomeArquivo,
    total_paginas: input.totalPaginas,
    total_alunos: input.totalAlunos,
    alunos_importados: 0,
    alunos_duplicados: 0,
    alunos_com_erro: 0,
    status: input.status,
    erros: input.erros ?? null,
    avisos: input.avisos ?? null,
  } as any);

  checkError(error);
}

export async function confirmStudentImport(input: ImportInput): Promise<ImportResult> {
  const { data: schoolData, error: schoolError } = await supabase
    .from("escolas")
    .select("id")
    .ilike("nome", input.escola)
    .maybeSingle() as any;

  checkError(schoolError);
  if (!schoolData) throw new Error("Escola identificada no PDF não está cadastrada.");

  const escolaId = (schoolData as Escola).id;

  const { data: existing, error: existingError } = await supabase
    .from("alunos")
    .select("matricula, inep")
    .eq("escola_id", escolaId) as any;

  checkError(existingError);

  const matriculas = new Set((existing ?? []).map((a: any) => a.matricula).filter(Boolean));
  const inepps = new Set((existing ?? []).map((a: any) => a.inep).filter(Boolean));

  const fresh: any[] = [];
  const duplicates: string[] = [];

  for (const student of input.students) {
    const isDuplicate =
      (student.matricula && matriculas.has(student.matricula)) ||
      (student.inep && inepps.has(student.inep));

    if (isDuplicate || !student.nome || !student.turma || !student.matricula) {
      duplicates.push(student.nome ?? "Aluno sem nome");
      continue;
    }

    fresh.push({
      escola_id: escolaId,
      nome: student.nome,
      inep: student.inep ?? null,
      turma: student.turma,
      matricula: student.matricula,
      data_matricula: student.dataMatricula ?? null,
      filiacao1: student.filiacao1 ?? null,
      filiacao2: student.filiacao2 ?? null,
      responsavel: student.responsavel ?? null,
      fone1: student.fone1 ?? null,
      fone2: student.fone2 ?? null,
      endereco: student.endereco ?? null,
      ativo: true,
    });

    if (student.matricula) matriculas.add(student.matricula);
    if (student.inep) inepps.add(student.inep);
  }

  if (fresh.length > 0) {
    const { error: insertError } = await supabase.from("alunos").insert(fresh);
    checkError(insertError);
  }

  return {
    inserted: fresh.length,
    skipped: input.students.length - fresh.length,
    duplicates,
  };
}

// ============================================================
// Helpers
// ============================================================
export async function getSchoolByName(nome: string): Promise<Escola | null> {
  const { data, error } = await supabase
    .from("escolas")
    .select("*")
    .ilike("nome", nome)
    .maybeSingle() as any;

  checkError(error);
  return data as Escola | null;
}
