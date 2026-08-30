import { AppLayout } from "@/components/AppLayout";
import { RequireAuth } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Search,
  Plus,
  Edit,
  Trash2,
  ShieldCheck,
  Users,
  GraduationCap,
} from "lucide-react";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";

type Escola = {
  id: number;
  nome: string;
  codigo: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

type EscolaStats = Escola & {
  alunos: number;
  turmas: number;
  faltas: number;
};

export default function AdminEscolas() {
  return (
    <RequireAuth perfil="ADMIN">
      <AppLayout>
        <EscolasContent />
      </AppLayout>
    </RequireAuth>
  );
}

function EscolasContent() {
  const [escolas, setEscolas] = useState<EscolaStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EscolaStats | null>(null);
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadEscolas = async () => {
    try {
      setLoading(true);
      const all = await api.listAllSchoolsWithStats();
      setEscolas(all);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar escolas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEscolas();
  }, []);

  const filtered = escolas.filter(
    (e) =>
      e.nome.toLowerCase().includes(search.toLowerCase()) ||
      e.codigo.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (escola: EscolaStats) => {
    setEditing(escola);
    setNome(escola.nome);
    setCodigo(escola.codigo);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditing(null);
    setNome("");
    setCodigo("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nome.trim() || !codigo.trim()) return;
    setError(null);
    try {
      if (editing) {
        await api.updateSchool({
          id: editing.id,
          nome,
          codigo,
          ativo: editing.ativo,
        });
      } else {
        await api.createSchool({ nome, codigo });
      }
      setDialogOpen(false);
      await loadEscolas();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar.");
    }
  };

  const toggleAtivo = async (escola: EscolaStats) => {
    try {
      await api.updateSchool({
        id: escola.id,
        nome: escola.nome,
        codigo: escola.codigo,
        ativo: !escola.ativo,
      });
      await loadEscolas();
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar.");
    }
  };

  return (
    <div className="section-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">GESTÃO</p>
          <h2>Escolas cadastradas</h2>
          <p className="muted-copy">Gerencie as unidades atendidas pela secretaria.</p>
        </div>
        <Button className="primary-button" onClick={handleCreate}>
          <Plus className="h-4 w-4" /> Nova escola
        </Button>
      </div>

      <Card className="table-card">
        <CardContent className="p-0">
          <div className="table-toolbar">
            <div className="search-box">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Buscar escola..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-0 shadow-none"
              />
            </div>
          </div>

          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Unidade escolar</th>
                  <th>Código</th>
                  <th>Alunos</th>
                  <th>Turmas</th>
                  <th>Faltas</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>Carregando escolas...</td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <div className="table-primary">
                          <div className="table-avatar">
                            {e.nome
                              .split(" ")
                              .map((w) => w[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <span>{e.nome}</span>
                        </div>
                      </td>
                      <td>{e.codigo}</td>
                      <td>{e.alunos}</td>
                      <td>{e.turmas}</td>
                      <td>{e.faltas}</td>
                      <td>
                        <Badge
                          className={
                            e.ativo
                              ? "status-badge success"
                              : "status-badge warning"
                          }
                        >
                          <span />
                          {e.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </td>
                      <td className="action-buttons">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(e)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {e.ativo ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAtivo(e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-icon">
                          <Building2 className="h-6 w-6" />
                        </div>
                        <h3>Nenhuma escola encontrada</h3>
                        <p>Suas buscas não retornaram resultados.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar escola" : "Nova escola"}
            </DialogTitle>
          </DialogHeader>
          <div className="form-grid">
            <div className="wide">
              <Label>Nome da escola</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: CEI LUIZ FELIPE"
              />
            </div>
            <div>
              <Label>Código</Label>
              <Input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex: ESC-01"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="primary-button"
              disabled={!nome.trim() || !codigo.trim()}
              onClick={handleSave}
            >
              {editing ? "Salvar alterações" : "Criar escola"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
