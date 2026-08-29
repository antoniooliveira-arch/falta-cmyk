import type { Escola, Usuario } from "@/types/supabase";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";

export type AuthUser = {
  id: string;
  username: string;
  nome: string | null;
  perfil: "ADMIN" | "ESCOLA";
  escolaId: number | null;
  escola: Escola | null;
  mustChangePassword: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSchool: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loginMutation = trpc.auth.login.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const meQuery = trpc.auth.me.useQuery();

  useEffect(() => {
    if (meQuery.data) {
      const u = meQuery.data;
      if (u) {
        setUser({
          id: String(u.id),
          username: u.username ?? "",
          nome: u.name ?? null,
          perfil: u.role === "admin" ? "ADMIN" : "ESCOLA",
          escolaId: null,
          escola: null,
          mustChangePassword: u.mustChangePassword ?? false,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    } else if (meQuery.isError || (meQuery.isFetching === false && meQuery.data === undefined)) {
      setUser(null);
      setLoading(false);
    }
  }, [meQuery.data, meQuery.isError, meQuery.isFetching]);

  const signIn = async (username: string, password: string) => {
    try {
      await loginMutation.mutateAsync({ username, password });
      await meQuery.refetch();
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    await logoutMutation.mutateAsync();
    setUser(null);
  };

  const refresh = async () => {
    await meQuery.refetch();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.perfil === "ADMIN",
      isSchool: user?.perfil === "ESCOLA",
      signIn,
      signUp: async () => { throw new Error("Use admin panel to create users"); },
      signOut,
      refresh,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}