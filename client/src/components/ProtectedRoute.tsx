import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck } from "lucide-react";
import { Redirect } from "wouter";

type RequireAuthProps = {
  children: React.ReactNode;
  perfil?: "ADMIN" | "ESCOLA";
};

export function RequireAuth({ children, perfil }: RequireAuthProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <ShieldCheck className="h-6 w-6 animate-pulse" />
        <span>Verificando sessão...</span>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (perfil && user.perfil !== perfil) {
    const redirect =
      user.perfil === "ADMIN" ? "/admin/dashboard" : "/escola/dashboard";
    return <Redirect to={redirect} />;
  }

  return <>{children}</>;
}
