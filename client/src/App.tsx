import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminEscolas from "./pages/admin/Escolas";
import AdminAlunos from "./pages/admin/Alunos";
import AdminImportarPDF from "./pages/admin/ImportarPDF";
import AdminFaltas from "./pages/admin/Faltas";
import AdminEnvios from "./pages/admin/Envios";
import AdminRelatorios from "./pages/admin/Relatorios";
import AdminUsuarios from "./pages/admin/Usuarios";
import EscolaDashboard from "./pages/escola/Dashboard";
import EscolaTurmas from "./pages/escola/Turmas";
import EscolaAlunos from "./pages/escola/Alunos";
import EscolaFaltas from "./pages/escola/Faltas";
import EscolaEnvios from "./pages/escola/Envios";
import NotFound from "./pages/NotFound";

function AppRouter() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />

      {/* Admin routes */}
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/escolas" component={AdminEscolas} />
      <Route path="/admin/usuarios" component={AdminUsuarios} />
      <Route path="/admin/alunos" component={AdminAlunos} />
      <Route path="/admin/importar-pdf" component={AdminImportarPDF} />
      <Route path="/admin/faltas" component={AdminFaltas} />
      <Route path="/admin/envios" component={AdminEnvios} />
      <Route path="/admin/relatorios" component={AdminRelatorios} />

      {/* Ecola routes */}
      <Route path="/escola/dashboard" component={EscolaDashboard} />
      <Route path="/escola/turmas" component={EscolaTurmas} />
      <Route path="/escola/alunos" component={EscolaAlunos} />
      <Route path="/escola/faltas" component={EscolaFaltas} />
      <Route path="/escola/envios" component={EscolaEnvios} />

      <Route path="/" component={LoginPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
