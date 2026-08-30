import { AppLayout } from "@/components/AppLayout";
import { RequireAuth } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { School, GraduationCap, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";

type Aluno = {
  id: number;
  nome: string;
  turma: string;
  matricula: string;
  inep: string | null;
  responsavel: string | null;
  fone1: string | null;
  fone2: string | null;
};

type TurmaGroup = {
  turma: string;
  alunos: Aluno[];
};

export default function EscolaTurmas() {
  return (
    <RequireAuth perfil="ESCOLA">
      <AppLayout>
        <TurmasContent />
      </AppLayout>
    </RequireAuth>
  );
}

function TurmasContent() {
  const { user } = useAuth();
  const escolaId = user?.escolaId;
  const [turmas, setTurmas] = useState<TurmaGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    if (!escolaId) return;
    try {
      setLoading(true);
      const alunos = await api.listStudents(escolaId);
      const map = new Map<string, Aluno[]>();
      alunos.forEach((a) => {
        const key = a.turma;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({
          id: a.id,
          nome: a.nome,
          turma: a.turma,
          matricula: a.matricula,
          inep: a.inep,
          responsavel: a.responsavel,
          fone1: a.fone1,
          fone2: a.fone2,
        });
      });

      const groups: TurmaGroup[] = Array.from(map.entries())
        .map(([turma, alunos]) => ({ turma, alunos }))
        .sort((a, b) => a.turma.localeCompare(b.turma));

      setTurmas(groups);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [escolaId]);

  const filtered = search
    ? turmas.filter((g) => g.turma.toLowerCase().includes(search.toLowerCase()))
    : turmas;

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
          <h2>Turmas</h2>
          <p className="muted-copy">
            Visualize as turmas e alunos vinculados à sua escola.
          </p>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="search-box flex-1">
          <Search className="h-4 w-4" />
          <input
            placeholder="Filtrar turma..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 w-full text-sm outline-none"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando turmas...</p>
      ) : filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => (
            <Card key={g.turma} className="table-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">{g.turma}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{g.alunos.length} aluno(s)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {g.alunos
                    .slice(0, 8)
                    .map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="text-xs text-muted-foreground w-6">
                          {g.alunos.indexOf(a) + 1}.
                        </span>
                        <span className="font-medium">{a.nome}</span>
                        <span className="text-muted-foreground">
                          (Mat: {a.matricula})
                        </span>
                      </div>
                    ))}
                  {g.alunos.length > 8 && (
                    <p className="text-xs text-muted-foreground">
                      +{g.alunos.length - 8} aluno(s)
                    </p>
                  )}
                </div>

                <Button
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => {
                    window.location.href = `/escola/alunos?turma=${encodeURIComponent(g.turma)}`;
                  }}
                >
                  Ver alunos
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <School className="h-6 w-6" />
          </div>
          <h3>Nenhuma turma encontrada</h3>
          <p>Suas buscas não retornaram resultados.</p>
        </div>
      )}
    </div>
  );
}
