import { AppLayout } from "@/components/AppLayout";
import { RequireAuth } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  UserCog,
  Search,
  Plus,
  Shield,
  School,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import { supabase } from "@/lib/supabase";

type UsuarioRow = {
  id: number;
  auth_user_id: string;
  nome: string;
  email: string;
  perfil: "ADMIN" | "ESCOLA";
  escola_nome: string | null;
  ativo: boolean;
};

type EscolaOption = {
  id: number;
  nome: string;
};

export default function AdminUsuarios() {
  return (
    <RequireAuth perfil="ADMIN">
      <AppLayout>
        <UsuariosContent />
      </AppLayout>
    </RequireAuth>
  );
}

function UsuariosContent() {
  const [users, setUsers] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [escolas, setEscolas] = useState<EscolaOption[]>([]);
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [perfil, setPerfil] = useState<"ADMIN" | "ESCOLA">("ESCOLA");
  const [escolaId, setEscolaId] = useState<string>("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.listBusinessUsers();
      setUsers(
        data.map((u) => ({
          id: u.id,
          auth_user_id: u.auth_user_id,
          nome: u.nome,
          email: u.email,
          perfil: u.perfil,
          escola_nome: u.escola_nome || null,
          ativo: !!u.ativo,
        }))
      );
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  };

  const loadEscolas = async () => {
    const all = await api.listSchools();
    setEscolas(all);
  };

  useEffect(() => {
    loadUsers();
    loadEscolas();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.nome.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!email || !password || !nome) {
      setErrorMsg("Preencha todos os campos obrigatórios.");
      return;
    }

    setIsCreating(true);
    setErrorMsg(null);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("Não foi possível criar a conta de auth.");

      await api.createBusinessUser({
        authUserId: authData.user.id,
        nome,
        email,
        perfil,
        escolaId: perfil === "ESCOLA" ? Number(escolaId) : undefined,
      });

      setDialogOpen(false);
      setEmail("");
      setNome("");
      setPassword("");
      setEscolaId("");
      setPerfil("ESCOLA");
      await loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao criar usuário.");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleAtivo = async (u: UsuarioRow) => {
    try {
      await supabase
        .from("usuarios")
        .update({ ativo: !u.ativo })
        .eq("id", u.id);
      await loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="section-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">GESTÃO</p>
          <h2>Usuários do sistema</h2>
          <p className="muted-copy">
            Acompanhe perfis, acessos e vínculos por unidade.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="primary-button">
              <Plus className="h-4 w-4" /> Novo usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo usuário operacional</DialogTitle>
              <p className="dialog-description">
                Crie a conta de autenticação e o vínculo com a unidade.
              </p>
            </DialogHeader>
            <div className="form-grid">
              <div>
                <label>Nome</label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label>E-mail</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@escola.edu.br"
                />
              </div>
              <div>
                <label>Senha</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha inicial"
                />
              </div>
              <div>
                <label>Perfil</label>
                <select
                  value={perfil}
                  onChange={(e) => {
                    setPerfil(e.target.value as "ADMIN" | "ESCOLA");
                    setEscolaId("");
                  }}
                  className="border rounded px-3 py-2 text-sm"
                >
                  <option value="ESCOLA">ESCOLA</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              {perfil === "ESCOLA" && (
                <div className="wide">
                  <label>Unidade escolar</label>
                  <select
                    value={escolaId}
                    onChange={(e) => setEscolaId(e.target.value)}
                    className="border rounded px-3 py-2 text-sm w-full"
                  >
                    <option value="">Selecione uma escola</option>
                    {escolas.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

            <div className="dialog-footer">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="primary-button"
                disabled={isCreating || !email || !password || !nome}
                onClick={handleCreate}
              >
                {isCreating ? "Criando..." : "Criar usuário"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="table-card">
        <CardContent className="p-0">
          <div className="table-toolbar">
            <div className="search-box">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Buscar usuário..."
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
                  <th>Usuário</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Escola vinculada</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>Carregando usuários...</td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="table-primary">
                          <div className="table-avatar">
                            {u.nome
                              .split(" ")
                              .map((w) => w[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <span>{u.nome}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        {u.perfil === "ADMIN" ? (
                          <Badge variant="outline">
                            <Shield className="h-3 w-3 mr-1" />
                            ADMIN
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <School className="h-3 w-3 mr-1" />
                            ESCOLA
                          </Badge>
                        )}
                      </td>
                      <td>{u.escola_nome || "Acesso central"}</td>
                      <td>
                        <Badge
                          className={
                            u.ativo
                              ? "status-badge success"
                              : "status-badge warning"
                          }
                        >
                          <span />
                          {u.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="action-buttons">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAtivo(u)}
                        >
                          {u.ativo ? "Desativar" : "Ativar"}
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-icon">
                          <UserRound className="h-6 w-6" />
                        </div>
                        <h3>Nenhum usuário encontrado</h3>
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
    </div>
  );
}
