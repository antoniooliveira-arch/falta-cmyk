import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ArrowUpRight, CheckCircle2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function LoginPage() {
  const { signIn, isAuthenticated, loading, user, refresh } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const redirect = user.perfil === "ADMIN" ? "/admin/dashboard" : "/escola/dashboard";
      setLocation(redirect);
    }
  }, [loading, isAuthenticated, user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await signIn(username, password);
      await refresh();
    } catch (err: any) {
      setError(err.message || "Credenciais inválidas. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="brand-mark small">
          <ShieldCheck />
        </div>
        <span>Carregando ambiente seguro...</span>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return null;
  }

  return (
    <div className="login-page">
      <div className="login-orbit orbit-one" />
      <div className="login-orbit orbit-two" />

      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark large">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="eyebrow">SECRETARIA MUNICIPAL DE EDUCAÇÃO</p>
          <h1>EduControl</h1>
          <p className="login-tagline">
            Sistema de Controle de Faltas dos Alunos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-field">
            <Label htmlFor="username">Usuário</Label>
            <Input
              id="username"
              type="text"
              placeholder="ex: cei-luiz-felipe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-field">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-message">
              <ShieldCheck className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="login-button w-full"
            disabled={isSubmitting || !username || !password}
            size="lg"
          >
            {isSubmitting ? "Entrando..." : "ENTRAR"}
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="login-footer">
          <CheckCircle2 className="h-3 w-3" />
          <span>Acesso restrito a usuários cadastrados pela secretaria</span>
        </div>
      </div>
    </div>
  );
}
