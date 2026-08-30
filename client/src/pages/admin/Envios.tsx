import { AppLayout } from "@/components/AppLayout";
import { RequireAuth } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FileCheck2,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";

type Envio = {
  id: number;
  escola_id: number;
  usuario_id: number;
  periodo: string;
  observacao: string | null;
  status: string;
  enviado_em: string | null;
  analisado_em: string | null;
  analisado_por: number | null;
  observacao_admin: string | null;
  created_at: string;
  escola_nome: string | null;
};

type FaltaRow = {
  id: number;
  aluno_id: number;
  escola_id: number;
  data_falta: string;
  quantidade_dias: number;
  motivo: string;
  observacao: string | null;
  status: string;
  aluno_nome: string | null;
  aluno_turma: string | null;
};

export default function AdminEnvios() {
  return (
    <RequireAuth perfil="ADMIN">
      <AppLayout>
        <EnviosContent />
      </AppLayout>
    </RequireAuth>
  );
}

function EnviosContent() {
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Envio | null>(null);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [faltas, setFaltas] = useState<FaltaRow[]>([]);
  const [note, setNote] = useState("");
  const [acao, setAcao] = useState<"APROVADO" | "REJEITADO" | "EM_ANALISE" | null>(null);

  const loadEnvios = async () => {
    try {
      setLoading(true);
      const data = await api.listSubmissions();
      setEnvios(data as Envio[]);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnvios();
  }, []);

  const filtered = envios.filter(
    (e) =>
      e.periodo.toLowerCase().includes(search.toLowerCase()) ||
      (e.escola_nome || "").toLowerCase().includes(search.toLowerCase())
  );

  const openDetalhes = async (envio: Envio) => {
    setSelected(envio);
    setDetalhesOpen(true);
    setNote("");
    setAcao(null);

    const faltas = await api.listAbsences({ escolaId: envio.escola_id });
    setFaltas(faltas as unknown as FaltaRow[]);
  };

  const handleReview = async () => {
    if (!selected || !acao) return;

    try {
      const usuario = await api.listBusinessUsers();
      const adminId = usuario.find((u) => u.perfil === "ADMIN")?.id ?? 0;

      await api.reviewSubmission({
        id: selected.id,
        status: acao,
        analisadoPor: adminId,
        observacaoAdmin: note || undefined,
      });

      await loadEnvios();
      setDetalhesOpen(false);
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
          <p className="eyebrow">GESTÃO</p>
          <h2>Envios recebidos</h2>
          <p className="muted-copy">
            Revise os registros enviados pelas unidades escolares.
          </p>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="search-box flex-1">
          <Search className="h-4 w-4" />
          <Input
            placeholder="Buscar envio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 shadow-none"
          />
        </div>
      </div>

      <Card className="table-card">
        <CardContent className="p-0">
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Escola</th>
                  <th>Período</th>
                  <th>Data de envio</th>
                  <th>Status</th>
                  <th>Observação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>Carregando envios...</td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map((e) => (
                    <tr key={e.id}>
                      <td className="table-primary">
                        {e.escola_nome || "—"}
                      </td>
                      <td>{e.periodo}</td>
                      <td>
                        {e.enviado_em
                          ? new Date(e.enviado_em).toLocaleDateString("pt-BR")
                          : "—"}
                      </td>
                      <td>
                        <Badge className={`status-badge ${statusBadge(e.status)}`}>
                          <span />
                          {e.status}
                        </Badge>
                      </td>
                      <td>{e.observacao_admin || e.observacao || "—"}</td>
                      <td className="action-buttons">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetalhes(e)}
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
                          <FileCheck2 className="h-6 w-6" />
                        </div>
                        <h3>Nenhum envio encontrado</h3>
                        <p>Os envios das escolas aparecerão nesta lista.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detalhesOpen} onOpenChange={setDetalhesOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Envio — {selected?.escola_nome || "—"} ({selected?.periodo})
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <>
              <div className="mb-4 flex gap-4">
                <Badge className="status-badge success">
                  <span />
                  {faltas.length} falta(s)
                </Badge>
                <Badge
                  className={selected.status === "APROVADO" ? "status-badge success" : selected.status === "REJEITADO" ? "status-badge error" : "status-badge warning"}
                >
                  <span />
                  Status atual: {selected.status}
                </Badge>
              </div>

              <div className="max-h-60 overflow-y-auto border rounded">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left">Aluno</th>
                      <th className="p-2 text-left">Turma</th>
                      <th className="p-2 text-left">Data</th>
                      <th className="p-2 text-left">Dias</th>
                      <th className="p-2 text-left">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faltas.map((f) => (
                      <tr key={f.id} className="border-t">
                        <td className="p-2">{f.aluno_nome || "—"}</td>
                        <td className="p-2">{f.aluno_turma || "—"}</td>
                        <td className="p-2">{f.data_falta}</td>
                        <td className="p-2">{f.quantidade_dias}</td>
                        <td className="p-2">{f.motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Observação do administrador
                </label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    selected.status === "REJEITADO"
                      ? "Descreva os pontos que precisam ser revisados..."
                      : "Observações sobre a análise..."
                  }
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDetalhesOpen(false)}
                >
                  Fechar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAcao("EM_ANALISE");
                    handleReview();
                  }}
                >
                  <Clock3 className="h-4 w-4 mr-1" />
                  Em análise
                </Button>
                <Button
                  className="primary-button"
                  onClick={() => {
                    setAcao("APROVADO");
                    handleReview();
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Aprovar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setAcao("REJEITADO");
                    handleReview();
                  }}
                  disabled={!note.trim()}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Rejeitar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
