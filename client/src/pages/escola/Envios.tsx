import { AppLayout } from "@/components/AppLayout";
import { RequireAuth } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileCheck2,
  Search,
  Clock3,
  CheckCircle2,
  XCircle,
  CalendarDays,
} from "lucide-react";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";

type Envio = {
  id: number;
  escola_id: number;
  periodo: string;
  observacao: string | null;
  status: string;
  enviado_em: string | null;
  analisado_em: string | null;
  observacao_admin: string | null;
  created_at: string;
};

type FaltaResumo = {
  id: number;
  aluno_nome: string | null;
  data_falta: string;
  quantidade_dias: number;
  motivo: string;
  status: string;
};

export default function EscolaEnvios() {
  return (
    <RequireAuth perfil="ESCOLA">
      <AppLayout>
        <EnviosContent />
      </AppLayout>
    </RequireAuth>
  );
}

function EnviosContent() {
  const { user } = useAuth();
  const escolaId = user?.escolaId ?? 0;
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [observacao, setObservacao] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [faltasARes, setFaltasARes] = useState<FaltaResumo[]>([]);

  const loadEnvios = async () => {
    if (!escolaId) return;
    try {
      setLoading(true);
      const data = await api.listSubmissions(escolaId);
      setEnvios(data as unknown as Envio[]);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnvios();
  }, [escolaId]);

  const filtered = envios.filter(
    (e) =>
      e.periodo.toLowerCase().includes(search.toLowerCase()) ||
      (e.observacao || "").toLowerCase().includes(search.toLowerCase())
  );

  const openReview = async () => {
    if (!escolaId) return;
    try {
      const faltas = await api.listAbsences({ escolaId });
      setFaltasARes(
        faltas.map((f: any) => ({
          id: f.id,
          aluno_nome: f.aluno_nome,
          data_falta: f.data_falta,
          quantidade_dias: f.quantidade_dias,
          motivo: f.motivo,
          status: f.status,
        }))
      );
      setReviewOpen(true);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleEnviar = async () => {
    if (!escolaId || !periodo) return;

    try {
      const usuarios = await api.listBusinessUsers();
      const schoolUser = usuarios.find((u) => u.perfil === "ESCOLA" && u.escola_id === escolaId);
      if (!schoolUser) throw new Error("Usuário escolar não encontrado.");

      const faltasDraft = faltasARes.filter((f) => f.status === "RASCUNHO");

      await api.createSubmission({
        escolaId,
        usuarioId: schoolUser.id,
        periodo,
        observacao: observacao || undefined,
        faltas: faltasDraft.map((f) => ({
          id: f.id,
          data_falta: f.data_falta,
        })),
      });

      setReviewOpen(false);
      setPeriodo("");
      setObservacao("");
      setFaltasARes([]);
      await loadEnvios();
    } catch (err: any) {
      console.error(err);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      RASCUNHO: "warning",
      ENVIADO: "success",
      EM_ANALISE: "amber",
      APROVADO: "success",
      REJEITADO: "error",
    };
    return map[status] ?? "success";
  };

  return (
    <div className="section-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">UNIDADE ESCOLAR</p>
          <h2>Meus envios</h2>
          <p className="muted-copy">
            Envie os registros do período para revisão da secretaria.
          </p>
        </div>
      </div>

      <Card className="submission-compose">
        <CardHeader>
          <CardTitle>
            <p className="eyebrow">NOVO ENVIO</p>
            Enviar registros de faltas
          </CardTitle>
          <p className="card-subtitle">
            O envio atribui status ENVIADO às faltas em rascunho do período.
          </p>
        </CardHeader>
        <CardContent>
          <div className="form-grid">
            <div>
              <label>Período</label>
              <Input
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                placeholder="Ex.: Agosto de 2026"
              />
            </div>
            <div className="wide">
              <label>Observação</label>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Mensagem opcional ao administrador"
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={3}
              />
            </div>
          </div>

          <div className="compose-actions">
            <Button
              className="primary-button"
              disabled={!periodo || faltasARes.length === 0}
              onClick={openReview}
            >
              <FileCheck2 className="h-4 w-4" /> Revisar e enviar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="table-card mt-6">
        <CardContent className="p-0">
          <div className="table-toolbar">
            <div className="search-box flex-1">
              <Search className="h-4 w-4" />
              <input
                placeholder="Buscar envio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-0 w-full text-sm outline-none"
              />
            </div>
          </div>

          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Período</th>
                  <th>Data de envio</th>
                  <th>Observação</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5}>Carregando envios...</td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map((e) => (
                    <tr key={e.id}>
                      <td className="table-primary">{e.periodo}</td>
                      <td>
                        {e.enviado_em
                          ? new Date(e.enviado_em).toLocaleDateString("pt-BR")
                          : "—"}
                      </td>
                      <td>{e.observacao || "—"}</td>
                      <td>
                        <Badge className={`status-badge ${statusBadge(e.status)}`}>
                          <span />
                          {e.status}
                        </Badge>
                      </td>
                      <td className="action-buttons">
                        <Button variant="ghost" size="sm">
                          <Search className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <div className="empty-icon">
                          <FileCheck2 className="h-6 w-6" />
                        </div>
                        <h3>Nenhum envio encontrado</h3>
                        <p>O histórico de envios aparecerá nesta lista.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revisar faltas antes do envio</DialogTitle>
          </DialogHeader>

          <div className="review-summary">
            <strong>{faltasARes.filter((f) => f.status === "RASCUNHO").length} falta(s)</strong>
            <span>serão vinculadas ao período {periodo || "informado"}</span>
          </div>

          <div className="max-h-60 overflow-y-auto border rounded">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 text-left">Aluno</th>
                  <th className="p-2 text-left">Data</th>
                  <th className="p-2 text-left">Dias</th>
                  <th className="p-2 text-left">Motivo</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {faltasARes.map((f) => (
                  <tr key={f.id} className="border-t">
                    <td className="p-2">{f.aluno_nome || "—"}</td>
                    <td className="p-2">{f.data_falta}</td>
                    <td className="p-2">{f.quantidade_dias}</td>
                    <td className="p-2">{f.motivo}</td>
                    <td className="p-2">{f.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="primary-button"
              disabled={!periodo}
              onClick={handleEnviar}
            >
              Confirmar envio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
