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
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  Search,
  CalendarDays,
  Filter,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";

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
  status: string;
  created_at: string;
  aluno_nome?: string | null;
  aluno_turma?: string | null;
};

type EscolaOption = { id: number; nome: string };

export default function AdminFaltas() {
  return (
    <RequireAuth perfil="ADMIN">
      <AppLayout>
        <FaltasContent />
      </AppLayout>
    </RequireAuth>
  );
}

function FaltasContent() {
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [loading, setLoading] = useState(true);
  const [escolas, setEscolas] = useState<EscolaOption[]>([]);
  const [search, setSearch] = useState("");
  const [escolaFilter, setEscolaFilter] = useState<string>("all");
  const [turmaFilter, setTurmaFilter] = useState("");
  const [period, setPeriod] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const statuses = ["RASCUNHO", "ENVIADO", "EM_ANALISE", "APROVADO", "REJEITADO"];

  const loadFaltas = async () => {
    try {
      setLoading(true);
      const data = await api.listAbsences({
        escolaId: escolaFilter !== "all" ? Number(escolaFilter) : undefined,
        search: search || undefined,
        period: period || undefined,
        turma: turmaFilter || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setFaltas(data as Falta[]);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaltas();
    api.listSchools().then((all) => setEscolas(all.map((e) => ({ id: e.id, nome: e.nome }))));
  }, [escolaFilter, search, period, turmaFilter, statusFilter]);

  return (
    <div className="section-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">GESTÃO</p>
          <h2>Registro de faltas</h2>
          <p className="muted-copy">
            Consulte ocorrências por aluno, turma, período e status.
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
            <Input
              placeholder="Turma"
              value={turmaFilter}
              onChange={(e) => setTurmaFilter(e.target.value)}
              className="w-32"
            />
            <Input
              placeholder="Período (2026-08)"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-36"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="filter-select">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Turma</th>
                  <th>Escola</th>
                  <th>Data</th>
                  <th>Dias</th>
                  <th>Motivo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>Carregando faltas...</td>
                  </tr>
                ) : faltas.length ? (
                  faltas.map((f) => (
                    <tr key={f.id}>
                      <td className="table-primary">
                        {f.aluno_nome || "—"}
                      </td>
                      <td>{f.aluno_turma || "—"}</td>
                      <td>{escolas.find((e) => e.id === f.escola_id)?.nome || f.escola_id}</td>
                      <td>{f.data_falta}</td>
                      <td>{f.quantidade_dias}</td>
                      <td>{f.motivo}</td>
                      <td>
                        <Badge className="status-badge success">
                          <span />
                          {f.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-icon">
                          <ClipboardList className="h-6 w-6" />
                        </div>
                        <h3>Nenhuma falta registrada</h3>
                        <p>Los registros aparecerão aqui conforme forem cadastrados.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
