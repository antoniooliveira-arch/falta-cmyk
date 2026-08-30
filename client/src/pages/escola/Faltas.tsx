import { AppLayout } from "@/components/AppLayout";
import { RequireAuth } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
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
import { ClipboardList, Search, CalendarDays, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";

type Falta = {
  id: number;
  aluno_id: number;
  data_falta: string;
  quantidade_dias: number;
  motivo: string;
  observacao: string | null;
  ficai_participa: "SIM" | "NAO";
  status: string;
  created_at: string;
  aluno_nome: string | null;
  aluno_turma: string | null;
};

export default function EscolaFaltas() {
  return (
    <RequireAuth perfil="ESCOLA">
      <AppLayout>
        <FaltasContent />
      </AppLayout>
    </RequireAuth>
  );
}

function FaltasContent() {
  const { user } = useAuth();
  const escolaId = user?.escolaId ?? 0;
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("");
  const [status, setStatus] = useState<string>("all");

  const statuses = ["RASCUNHO", "ENVIADO", "EM_ANALISE", "APROVADO", "REJEITADO"];

  const load = async () => {
    if (!escolaId) return;
    try {
      setLoading(true);
      const data = await api.listAbsences({
        escolaId,
        search: search || undefined,
        period: period || undefined,
        status: status !== "all" ? status : undefined,
      });
      setFaltas(data as unknown as Falta[]);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, period, status]);

  const filtered = faltas.filter((f) => {
    const matchesSearch = f.aluno_nome?.toLowerCase().includes(search.toLowerCase()) ?? false;
    return matchesSearch;
  });

  return (
    <div className="section-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">UNIDADE ESCOLAR</p>
          <h2>Registro de faltas</h2>
          <p className="muted-copy">
            Consulte as ocorrências registradas por aluno, turma e status.
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
        <input
          placeholder="Período (2026-08)"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-40 text-sm border rounded px-2 py-1"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="filter-select w-40">
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

      <Card className="table-card">
        <CardContent className="p-0">
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Turma</th>
                  <th>Data</th>
                  <th>Dias</th>
                  <th>Motivo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>Carregando faltas...</td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map((f) => (
                    <tr key={f.id}>
                      <td className="table-primary">
                        {f.aluno_nome || "—"}
                      </td>
                      <td>{f.aluno_turma || "—"}</td>
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
                    <td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-icon">
                          <ClipboardList className="h-6 w-6" />
                        </div>
                        <h3>Nenhuma falta registrada</h3>
                        <p>As ocorrências aparecerão aqui conforme forem cadastradas.</p>
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
