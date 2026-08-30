export type Database = {
  public: {
    Tables: {
      escolas: {
        Row: {
          id: number;
          nome: string;
          codigo: string;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          nome: string;
          codigo: string;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: number;
          nome: string;
          codigo: string;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        }>;
      };
      usuarios: {
        Row: {
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
        Insert: {
          id?: number;
          auth_user_id: string;
          nome: string;
          email: string;
          perfil: "ADMIN" | "ESCOLA";
          escola_id?: number | null;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["usuarios"]["Insert"]>;
      };
      alunos: {
        Row: {
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
        Insert: Partial<{
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
        }>;
        Update: Partial<Database["public"]["Tables"]["alunos"]["Insert"]>;
      };
      faltas: {
        Row: {
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
        Insert: Partial<Database["public"]["Tables"]["faltas"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["faltas"]["Row"]>;
      };
      envios_faltas: {
        Row: {
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
        Insert: Partial<Database["public"]["Tables"]["envios_faltas"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["envios_faltas"]["Row"]>;
      };
      importacoes_pdf: {
        Row: {
          id: number;
          escola_id: number | null;
          usuario_id: number;
          nome_arquivo: string;
          total_paginas: number;
          total_alunos: number;
          alunos_importados: number;
          alunos_duplicados: number;
          alunos_com_erro: number;
          status: "PROCESSANDO" | "CONCLUIDA" | "CONCLUIDA_COM_AVISOS" | "ERRO";
          erros: string | null;
          avisos: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["importacoes_pdf"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["importacoes_pdf"]["Row"]>;
      };
    };
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
    CompositeTypes: Record<string, unknown>;
  };
};

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Escola = TablesRow<"escolas">;
export type Usuario = TablesRow<"usuarios">;
export type Aluno = TablesRow<"alunos">;
export type Falta = TablesRow<"faltas">;
export type EnvioFalta = TablesRow<"envios_faltas">;
export type ImportacaoPdf = TablesRow<"importacoes_pdf">;

export type Perfil = "ADMIN" | "ESCOLA";
export type StatusFalta = "RASCUNHO" | "ENVIADO" | "EM_ANALISE" | "APROVADO" | "REJEITADO";
export type StatusEnvio = "RASCUNHO" | "ENVIADO" | "EM_ANALISE" | "APROVADO" | "REJEITADO";
export type StatusImportacao = "PROCESSANDO" | "CONCLUIDA" | "CONCLUIDA_COM_AVISOS" | "ERRO";

export type AuthUser = {
  id: string;
  email: string | undefined;
  nome: string | null;
  perfil: Perfil;
  escolaId: number | null;
  escola: Escola | null;
};

export type UsuarioWithEscola = Usuario & { escola_nome?: string | null };
export type AlunoWithEscola = Aluno & { escola_nome?: string | null };
