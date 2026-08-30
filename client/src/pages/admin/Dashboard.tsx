import { AppLayout } from "@/components/AppLayout";
import { RequireAuth } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, ClipboardList, Clock3, ShieldCheck, FileUp, FileCheck2 } from "lucide-react";
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

export default function AdminDashboard() {
  return (
    <RequireAuth perfil="ADMIN">
      <AppLayout>
        <DashboardContent />
      </AppLayout>
    </RequireAuth>
  );
}

function DashboardContent() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getOverview()
      .then(setOverview)
      .catch((err) => setError(err.message || "Erro ao carregar dados."))
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

  if (error) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  if (!overview) return null;

  return (
    <>
      <section className="dashboard-hero">
        <div className="hero-copy">
          <p className="eyebrow">CENTRAL DE OPERAÇÕES</p>
          <h2>
            Olá, <span>Administrador</span>
          </h2>
          <p className="hero-description">
            Acompanhe alunos, faltas e envios de toda a rede municipal em um só lugar.
          </p>
          <div className="hero-meta">
            <span>
              <ShieldCheck className="h-3 w-3" /> Dados sincronizados via Supabase
            </span>
          </div>
        </div>
        <div className="hero-action">
          <div className="hero-action-icon">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="eyebrow">UNIDADES ATIVAS</p>
            <strong>{overview.schools} escolas conectadas</strong>
            <span>Administre todas as unidades da rede municipal.</span>
          </div>
        </div>
      </section>

      <div className="stats-grid">
        <StatCard
          title="Escolas ativas"
          value={String(overview.schools)}
          caption="Toda a rede municipal"
          icon={Building2}
          tone="blue"
        />
        <StatCard
          title="Alunos cadastrados"
          value={String(overview.students)}
          caption="Cadastros ativos"
          icon={Users}
          tone="violet"
        />
        <StatCard
          title="Faltas registradas"
          value={String(overview.absences)}
          caption="Total do sistema"
          icon={ClipboardList}
          tone="amber"
        />
        <StatCard
          title="Envios pendentes"
          value={String(overview.pending)}
          caption="Aguardando análise"
          icon={Clock3}
          tone="green"
        />
      </div>

      <Card className="mt-6 table-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            Acesso rápido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <a
              href="/admin/importar-pdf"
              className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-4 text-center transition-colors hover:bg-accent"
            >
              <FileUp className="h-5 w-5 text-blue-600" />
              <span className="text-xs font-medium">Importar PDF</span>
            </a>
            <a
              href="/admin/escolas"
              className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-4 text-center transition-colors hover:bg-accent"
            >
              <Building2 className="h-5 w-5 text-indigo-600" />
              <span className="text-xs font-medium">Gerenciar escolas</span>
            </a>
            <a
              href="/admin/envios"
              className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-4 text-center transition-colors hover:bg-accent"
            >
              <FileCheck2 className="h-5 w-5 text-amber-600" />
              <span className="text-xs font-medium">Analisar envios</span>
            </a>
            <a
              href="/admin/faltas"
              className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-4 text-center transition-colors hover:bg-accent"
            >
              <ClipboardList className="h-5 w-5 text-purple-600" />
              <span className="text-xs font-medium">Ver todas as faltas</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
