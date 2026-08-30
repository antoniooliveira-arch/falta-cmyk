import { AppLayout } from "@/components/AppLayout";
import { RequireAuth } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  GraduationCap,
  Search,
  CalendarDays,
  FileText,
  Clock3,
} from "lucide-react";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import { formatDateBR, maskDate } from "@/lib/utils";

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
};

type Falta = {
  id: number;
  aluno_id: number;
  data_falta: string;
  quantidade_dias: number;
  motivo: string;
  observacao: string | null;
  status: string;
  created_at: string;
};

export default function EscolaAlunos() {
  return (
    <RequireAuth perfil="ESCOLA">
      <AppLayout>
        <AlunosContent />
      </AppLayout>
    </RequireAuth>
  );
}

function AlunosContent() {
  const { user } = useAuth();
  const escolaId = user?.escolaId;
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [turmaFilter, setTurmaFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Aluno | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [dataFalta, setDataFalta] = useState("");
  const [dataFaltaInput, setDataFaltaInput] = useState("");
  const [dias, setDias] = useState("1");
  const [motivo, setMotivo] = useState("");
  const [observacao, setObservacao] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const turmaParam = urlParams.get("turma");
    if (turmaParam) setTurmaFilter(turmaParam);
  }, []);

  const load = async () => {
    if (!escolaId) return;
    try {
      setLoading(true);
      const data = await api.listStudents(escolaId);
      setAlunos(data as Aluno[]);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [escolaId]);

  const turmas = Array.from(new Set(alunos.map((a) => a.turma))).sort();

  const filtered = alunos.filter(
    (a) =>
      a.nome.toLowerCase().includes(search.toLowerCase()) &&
      (turmaFilter === "all" || a.turma === turmaFilter)
  );

  const handleOpen = (aluno: Aluno) => {
    setSelected(aluno);
    setDetailOpen(true);
    setDataFalta("");
    setDataFaltaInput("");
    setDias("1");
    setMotivo("");
    setObservacao("");
  };

  const handleSaveFalta = async () => {
    if (!selected || !escolaId || !dataFalta) return;

    setSaveLoading(true);
    try {
      const usuario = await api.listBusinessUsers();
      const schoolUser = usuario.find((u) => u.perfil === "ESCOLA" && u.escola_id === escolaId);
      if (!schoolUser) throw new Error("Usuário escolar não encontrado.");

      await api.createAbsence({
        alunoId: selected.id,
        escolaId: escolaId,
        dataFalta: dataFalta,
        quantidadeDias: Number(dias),
        motivo,
        observacao,
        ficaiParticipa: "SIM",
        registradoPor: schoolUser.id,
      });

      load();
      handleCloseDetail();
    } catch (err: any) {
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelected(null);
  };

  if (!escolaId) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        Usuário sem escola vinculada.
      </div>
    );
  }

  return (
    <div className="section-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">UNIDADE ESCOLAR</p>
          <h2>Alunos da unidade</h2>
          <p className="muted-copy">
            Consulte os cadastros organizados por turma.
          </p>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="search-box flex-1">
          <Search className="h-4 w-4" />
          <input
            placeholder="Buscar aluno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 w-full text-sm outline-none"
          />
        </div>
        <select
          value={turmaFilter}
          onChange={(e) => setTurmaFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">Todas as turmas</option>
          {turmas.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <Card className="table-card">
        <CardContent className="p-0">
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nome</th>
                  <th>Turma</th>
                  <th>Matrícula</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5}>Carregando alunos...</td>
                  </tr>
                ) : filtered.length ? (
                  filtered
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((a, i) => (
                      <tr key={a.id}>
                        <td>{i + 1}</td>
                        <td className="table-primary">{a.nome}</td>
                        <td>{a.turma}</td>
                        <td>{a.matricula}</td>
                        <td className="action-buttons">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpen(a)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <div className="empty-icon">
                          <GraduationCap className="h-6 w-6" />
                        </div>
                        <h3>Nenhum aluno encontrado</h3>
                        <p>Ajuste os filtros para visualizar os registros.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <StudentDialog
        student={selected}
        open={detailOpen}
        onClose={handleCloseDetail}
        dataFalta={dataFalta}
        onDataFaltaChange={setDataFalta}
        dataFaltaInput={dataFaltaInput}
        onDataFaltaInputChange={setDataFaltaInput}
        dias={dias}
        onDiasChange={setDias}
        motivo={motivo}
        onMotivoChange={setMotivo}
        observacao={observacao}
        onObservacaoChange={setObservacao}
        saveLoading={saveLoading}
        onSave={handleSaveFalta}
      />
    </div>
  );
}

function StudentDialog({
  student,
  open,
  onClose,
  dataFalta,
  onDataFaltaChange,
  dataFaltaInput,
  onDataFaltaInputChange,
  dias,
  onDiasChange,
  motivo,
  onMotivoChange,
  observacao,
  onObservacaoChange,
  saveLoading,
  onSave,
}: {
  student: Aluno | null;
  open: boolean;
  onClose: () => void;
  dataFalta: string;
  onDataFaltaChange: (v: string) => void;
  dataFaltaInput: string;
  onDataFaltaInputChange: (v: string) => void;
  dias: string;
  onDiasChange: (v: string) => void;
  motivo: string;
  onMotivoChange: (v: string) => void;
  observacao: string;
  onObservacaoChange: (v: string) => void;
  saveLoading: boolean;
  onSave: () => void;
}) {
  if (!student) return null;

  const handleDateInput = (val: string) => {
    const masked = maskDate(val);
    onDataFaltaInputChange(masked);

    if (masked.length === 10) {
      const parts = masked.split("/");
      const iso = `${parts[2]}-${parts[1]}-${parts[0]}`;
      onDataFaltaChange(iso);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Dados do aluno</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <span className="text-xs font-semibold text-muted-foreground">
                Nome
              </span>
              <strong className="block text-sm">{student.nome}</strong>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground">
                Turma
              </span>
              <strong className="block text-sm">{student.turma}</strong>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground">
                Matrícula
              </span>
              <strong className="block text-sm">{student.matricula}</strong>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground">
                INEP
              </span>
              <strong className="block text-sm">{student.inep || "—"}</strong>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground">
                Responsável
              </span>
              <strong className="block text-sm">
                {student.responsavel || "—"}
              </strong>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground">
                Fone 1
              </span>
              <strong className="block text-sm">{student.fone1 || "—"}</strong>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground">
                Fone 2
              </span>
              <strong className="block text-sm">{student.fone2 || "—"}</strong>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" /> Registro de falta
            </h3>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Data da falta *
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <CalendarDays className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="__/__/____"
                      value={dataFaltaInput}
                      onChange={(e) => handleDateInput(e.target.value)}
                      className="pl-8 cursor-pointer"
                      readOnly
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataFalta ? new Date(dataFalta) : undefined}
                    onSelect={(d) => {
                      if (d) {
                        const iso = d.toISOString().split("T")[0];
                        onDataFaltaChange(iso);
                        onDataFaltaInputChange(formatDateBR(iso));
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Quantidade de dias
              </label>
              <Input
                type="number"
                min="1"
                value={dias}
                onChange={(e) => onDiasChange(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Motivo *
              </label>
              <Input
                value={motivo}
                onChange={(e) => onMotivoChange(e.target.value)}
                placeholder="Ex: Doença, viagem..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Observação
              </label>
              <textarea
                value={observacao}
                onChange={(e) => onObservacaoChange(e.target.value)}
                placeholder="Observações adicionais..."
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={3}
              />
            </div>

            <Button
              className="primary-button w-full"
              disabled={saveLoading || !dataFalta || !motivo}
              onClick={onSave}
            >
              {saveLoading ? "Salvando..." : "Salvar falta"}
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
            <Clock3 className="h-4 w-4" /> Histórico de faltas
          </h3>
          <p className="text-xs text-muted-foreground">
            Carregue este aluno para ver o histórico completo de faltas.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
