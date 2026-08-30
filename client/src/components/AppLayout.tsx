import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ShieldCheck, LogOut, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useEffect } from "react";

export type NavItem = {
  label: string;
  path: string;
  icon: React.ElementType;
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="brand-mark small">
          <ShieldCheck />
        </div>
        <span>Carregando...</span>
      </div>
    );
  }

  if (!user) return null;

  const items: NavItem[] =
    user.perfil === "ADMIN"
      ? adminNavItems
      : schoolNavItems;

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="font-semibold">EduControl</span>
              <p className="text-xs text-muted-foreground">
                {user.perfil === "ADMIN" ? "Administração" : user.escola?.nome}
              </p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton asChild>
                  <a href={item.path}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <div className="px-3 py-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-accent">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user.nome
                        ? user.nome
                            .split(" ")
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium">{user.nome || "-"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger className="h-9 w-9 rounded-lg">
            <PanelLeft className="h-4 w-4" />
          </SidebarTrigger>
          <LocationTitle navItems={items} />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function LocationTitle({ navItems }: { navItems: NavItem[] }) {
  const [location] = useLocation();
  const title = navItems.find((item) => item.path === location)?.label || "Painel";
  return (
    <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
  );
}

import {
  LayoutDashboard,
  School,
  Users,
  GraduationCap,
  FileUp,
  ClipboardList,
  FileCheck2,
  BarChart3,
  Building2,
  CalendarDays,
} from "lucide-react";

const adminNavItems: NavItem[] = [
  { label: "Visão geral", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Escolas", icon: Building2, path: "/admin/escolas" },
  { label: "Usuários", icon: Users, path: "/admin/usuarios" },
  { label: "Alunos", icon: GraduationCap, path: "/admin/alunos" },
  { label: "Importar PDF", icon: FileUp, path: "/admin/importar-pdf" },
  { label: "Faltas", icon: ClipboardList, path: "/admin/faltas" },
  { label: "Envios", icon: FileCheck2, path: "/admin/envios" },
  { label: "Relatórios", icon: BarChart3, path: "/admin/relatorios" },
];

const schoolNavItems: NavItem[] = [
  { label: "Visão geral", icon: LayoutDashboard, path: "/escola/dashboard" },
  { label: "Turmas", icon: School, path: "/escola/turmas" },
  { label: "Alunos", icon: GraduationCap, path: "/escola/alunos" },
  { label: "Faltas", icon: ClipboardList, path: "/escola/faltas" },
  { label: "Envios", icon: FileCheck2, path: "/escola/envios" },
];
