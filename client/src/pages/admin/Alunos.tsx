import { AppLayout } from "@/components/AppLayout";
import { RequireAuth } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Search, Filter, Eye, Edit, Users, School } from "lucide-react";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";

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

type AlunoWithEscola = Aluno & {
  escola_nome: string | null;
};

export default function AdminAlunos() {
  return (
    <RequireAuth perfil="ADMIN">
      <AppLayout>
        <AlunosContent />
      </AppLayout>
    </RequireAuth>
  );
}

function AlunosContent() {
  const [alunos, setAlunos] = useState<AlunoWithEscola[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [escolaFilter, setEscolaFilter] = useState<string>("all");
  const [turmaFilter, setTurmaFilter] = useState<string>("all");
  const [selected, setSelected] = useState<AlunoWithEscola | null>(null);
  const [escolas, setEscolas] = useState<{ id: number; nome: string }[]>([]);

  const loadAlunos = async () => {
    try {
      setLoading(true);
      const all = await api.listStudents();
      const withEscola = await Promise.all(
        all.map(async (a) => {
          const schools = await api.listSchools();
          const school = schools.find((s) => s.id === a.escola_id);
          return { ...a, escola_nome: school?.nome ?? null };
        })
      );
      setAlunos(withEscola as AlunoWithEscola[]);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadEscolas = async () => {
    const all = await api.listSchools();
    setEscolas(all.map((e) => ({ id: e.id, nome: e.nome })));
  };

  useEffect(() => {
    loadAlunos();
    loadEscolas();
  }, []);

  const turmas = Array.from(new Set(alunos.map((a) => a.turma))).sort();

  const filtered = alunos.filter((a) => {
    const matchesSearch = a.nome.toLowerCase().includes(search.toLowerCase());
    const matchesEscola =
      escolaFilter === "all" || String(a.escola_id) === escolaFilter;
    const matchesTurma =
      turmaFilter === "all" || a.turma === turmaFilter;
    return matchesSearch && matchesEscola && matchesTurma;
  });

  return (
    <div className="section-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">GESTÃO</p>
          <h2>Todos os alunos</h2>
          <p className="muted-copy">
            Visualize alunos de todas as escolas. Use os filtros para localizar.
          </p>
        </div>
      </div>

      <Card className="table-card">
        <CardContent className="p-0">
          <div className="table-toolbar">
            <div className="search-box flex-1">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Buscar aluno..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-0 shadow-none"
              />
            </div>
            <Select value={escolaFilter} onValueChange={setEscolaFilter}>
              <SelectTrigger className="filter-select">
                <SelectValue placeholder="Todas as escolas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as escolas</SelectItem>
                {escolas.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={turmaFilter} onValueChange={setTurmaFilter}>
              <SelectTrigger className="filter-select">
                <SelectValue placeholder="Todas as turmas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as turmas</SelectItem>
                {turmas.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Escola</th>
                  <th>Turma</th>
                  <th>Matrícula</th>
                  <th>INEP</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>Carregando alunos...</td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map((a) => (
                    <tr key={a.id}>
                      <td className="table-primary">
                        <div className="table-avatar">
                          {a.nome.slice(0, 2).toUpperCase()}
                        </div>
                        <span>{a.nome}</span>
                      </td>
                      <td>{a.escola_nome || "—"}</td>
                      <td>{a.turma}</td>
                      <td>{a.matricula}</td>
                      <td>{a.inep || "—"}</td>
                      <td className="action-buttons">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelected(a)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
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
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}

function StudentDialog({
  student,
  open,
  onOpenChange,
}: {
  student: AlunoWithEscola | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="student-dialog">
        <DialogHeader>
          <DialogTitle>Dados do aluno</DialogTitle>
        </DialogHeader>
        <div className="student-details">
          <div className="wide">
            <span>Nome completo</span>
            <strong>{student.nome}</strong>
          </div>
          <div>
            <span>Escola</span>
            <strong>{student.escola_nome || "—"}</strong>
          </div>
          <div>
            <span>Turma</span>
            <strong>{student.turma}</strong>
          </div>
          <div>
            <span>Matrícula</span>
            <strong>{student.matricula}</strong>
          </div>
          <div>
            <span>INEP</span>
            <strong>{student.inep || "—"}</strong>
          </div>
          <div>
            <span>Data matrícula</span>
            <strong>{student.data_matricula || "—"}</strong>
          </div>
          <div>
            <span>Filição 1</span>
            <strong>{student.filiacao1 || "—"}</strong>
          </div>
          <div>
            <span>Filição 2</span>
            <strong>{student.filiacao2 || "—"}</strong>
          </div>
          <div>
            <span>Responsável</span>
            <strong>{student.responsavel || "—"}</strong>
          </div>
          <div>
            <span>Fone 1</span>
            <strong>{student.fone1 || "—"}</strong>
          </div>
          <div>
            <span>Fone 2</span>
            <strong>{student.fone2 || "—"}</strong>
          </div>
          <div className="wide">
            <span>Endereço</span>
            <strong>{student.endereco || "—"}</strong>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
