import { AppLayout } from "@/components/AppLayout";
import { RequireAuth } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, ClipboardList, Clock3, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";

type Overview = {
  schools: number;
  students: number;
  absences: number;
  pending: number;
};

type TurmaStat = {
  turma: string;
  total: number;
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

export default function EscolaDashboard() {
  return (
    <RequireAuth perfil="ESCOLA">
      <AppLayout>
        <DashboardContent />
      </AppLayout>
    </RequireAuth>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const escolaId = user?.escolaId ?? undefined;
  const [overview, setOverview] = useState<Overview | null>(null);
  const [turmas, setTurmas] = useState<TurmaStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [escolaName, setEscolaName] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const allSchools = await api.listSchools();
        const school = escolaId
          ? allSchools.find((s) => s.id === escolaId)
          : undefined;
        if (school) setEscolaName(school.nome);

        const overviewData = await api.getOverview(escolaId);
        setOverview(overviewData);

        const students = await api.listStudents(escolaId);
        const turmaMap = new Map<string, number>();
        students.forEach((s) => {
          turmaMap.set(s.turma, (turmaMap.get(s.turma) || 0) + 1);
        });
        setTurmas(Array.from(turmaMap.entries()).map(([turma, total]) => ({ turma, total })));
      } catch (err: any) {
        setError(err.message || "Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [escolaId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <GraduationCap className="h-6 w-6 animate-pulse text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  return (
    <>
      <section className="dashboard-hero">
        <div className="hero-copy">
          <p className="eyebrow">UNIDADE ESCOLAR</p>
          <h2>
            Olá, <span>escola</span>
          </h2>
          <p className="hero-description">
            Acompanhe alunos, faltas e envios da sua unidade em um só lugar.
          </p>
          <div className="hero-meta">
            <span>
              <Building2 className="h-3 w-3" /> {escolaName || "Carregando escola..."}
            </span>
          </div>
        </div>
        <div className="hero-action">
          <div className="hero-action-icon">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <p className="eyebrow">CONTROLE DE FALTAS</p>
            <strong>Sua escola em foco</strong>
            <span>Registre e envie faltas conforme a rotina da unidade.</span>
          </div>
        </div>
      </section>

      {overview && (
        <div className="stats-grid">
          <StatCard title="Total de alunos" value={String(overview.students)} caption="Matriculados" icon={Users} tone="violet" />
          <StatCard title="Total de turmas" value={String(turmas.length)} caption={overview.students > 0 ? turmas.length + " turmas" : "—"} icon={GraduationCap} tone="blue" />
          <StatCard title="Faltas registradas" value={String(overview.absences)} caption="No período atual" icon={ClipboardList} tone="amber" />
          <StatCard title="Envios pendentes" value={String(overview.pending)} caption="Aguardando análise" icon={Clock3} tone="green" />
        </div>
      )}

      <Card className="mt-6 table-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            Turmas da escola
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Turma</th>
                  <th>Alunos</th>
                </tr>
              </thead>
              <tbody>
                {turmas.length ? (
                  turmas.map((t) => (
                    <tr key={t.turma}>
                      <td>{t.turma}</td>
                      <td>{t.total}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2}>Nenhuma turma encontrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
