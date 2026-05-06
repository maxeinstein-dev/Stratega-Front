import { Link, Outlet, useNavigate, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, Wallet, ArrowLeftRight, Users, LogOut, Sparkles, Bell, Target } from "lucide-react";
import { useAuth } from "../core/auth";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { api } from "../core/api";
import { useQuery } from "@tanstack/react-query";

const NAV = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/wallets", label: "Carteiras", icon: Wallet },
  { to: "/transactions", label: "Transações", icon: ArrowLeftRight },
  { to: "/groups", label: "Grupos", icon: Users },
  { to: "/budgets", label: "Metas", icon: Target },
];

export default function MainLayout() {
  const { isAuthenticated, ready, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: notifications } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => api("/notifications"),
    enabled: !!user?.id,
    refetchInterval: 60000,
  });

  const unreadCount = (notifications ?? []).filter(n => !n.isRead).length;

  useEffect(() => {
    if (ready && !isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate, ready]);

  if (!ready || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-sidebar p-4 md:flex md:flex-col">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-2">
          <div
            className="grid h-9 w-9 place-items-center rounded-xl"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold">Stratega</span>
        </Link>
        
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((n) => {
            const active = location.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card/60 p-3">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full justify-start gap-2"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:ml-64">
        <div className="flex items-center gap-2 md:hidden">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-display font-bold">Stratega</span>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -right-1 -top-1 h-5 w-5 justify-center rounded-full bg-destructive p-0 text-[10px]">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <div className="mb-2 flex items-center justify-between border-b pb-2">
                  <span className="text-sm font-semibold">Notificações</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs">{unreadCount} novas</Badge>
                  )}
                </div>
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {notifications?.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">Nenhuma notificação.</p>
                  ) : (
                    notifications?.map((n) => (
                      <div
                        key={n.id}
                        className={`rounded-lg border p-2 text-sm ${
                          n.isRead ? "bg-background opacity-70" : "border-primary/20 bg-muted/50"
                        }`}
                      >
                        <p className="mb-1 text-xs font-medium text-primary">
                          {n.type === "OVERDRAFT_ACTIVATED" ? "Cheque Especial" : "Aviso"}
                        </p>
                        <p className="text-xs text-muted-foreground">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <nav className="sticky top-[57px] z-10 flex gap-1 overflow-x-auto border-b border-border bg-background/80 px-2 py-2 backdrop-blur md:hidden">
        {NAV.map((n) => {
          const active = location.pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-xs ${active ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}
            >
              <n.icon className="h-3.5 w-3.5" /> {n.label}
            </Link>
          );
        })}
      </nav>

      <main className="md:ml-64">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}


