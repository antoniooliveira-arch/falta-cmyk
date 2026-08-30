import { AppLayout } from "@/components/AppLayout";
import { RequireAuth } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Building2,
  Users,
  ClipboardList,
  FileCheck2,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";

type Overview = {
  schools: number;
  students: number;
  absences: number;
  pending: number;
};

function StatCard({ title, value, caption, icon: Icon, tone = "blue" }: {
  title: string;
  value: string;
  caption: string;
  icon: React.ElementType;
  tone?: string;
}) {
  return (
    <Card className="stat-card border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{caption}</p>
          </div>
          <div className={`icon-tile tone-${tone}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminRelatorios() {
  return (
    <RequireAuth perfil="ADMIN">
      <AppLayout>
        <RelatoriosContent />
      </AppLayout>
    </RequireAuth>
  );
}

function RelatoriosContent() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [schoolStats, setSchoolStats] = useState<Array<{
    id: number;
    nome: string;
    alunos: number;
    faltas: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getOverview()
      .then(setOverview)
      .catch(console.error);

    api.listAllSchoolsWithStats().then((all) =>
      setSchoolStats(
        all.map((s) => ({
          id: s.id,
          nome: s.nome,
          alunos: s.alunos,
          faltas: s.faltas,
        }))
      )
    );

    Promise.all([api.getOverview(), api.listAllSchoolsWithStats()])
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ShieldCheck className="h-6 w-6 animate-pulse text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="section-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">GESTÃO</p>
          <h2>Relatórios</h2>
          <p className="muted-copy">
            Visão consolidada por escola para apoiar a tomada de decisão.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Escolas ativas" value={String(overview?.schools ?? "—")} caption="Rede municipal" icon={Building2} tone="blue" />
        <StatCard title="Alunos" value={String(overview?.students ?? "—")} caption="Cadastros ativos" icon={Users} tone="violet" />
        <StatCard title="Faltas" value={String(overview?.absences ?? "—")} caption="Registros consolidados" icon={ClipboardList} tone="amber" />
        <StatCard title="Envios pendentes" value={String(overview?.pending ?? "—")} caption="Aguardando análise" icon={Clock3} tone="green" />
      </div>

      <Card className="table-card">
        <CardHeader>
          <CardTitle>Resumo por escola</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Escola</th>
                  <th>Alunos</th>
                  <th>Faltas</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {schoolStats.length ? (
                  schoolStats
                    .sort((a, b) => b.faltas - a.faltas)
                    .map((s) => (
                      <tr key={s.id}>
                        <td className="table-primary">
                          <div className="table-avatar">
                            {s.nome.slice(0, 2).toUpperCase()}
                          </div>
                          <span>{s.nome}</span>
                        </td>
                        <td>{s.alunos}</td>
                        <td>{s.faltas}</td>
                        <td>
                          <Badge className="status-badge success">
                            <span /> Ativa
                          </Badge>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={4}>Nenhuma escola encontrada.</td>
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
