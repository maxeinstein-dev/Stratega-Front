import { Outlet, Navigate } from "react-router";
import { useAuth } from "../core/auth";
import { Sparkles } from "lucide-react";

export default function AuthLayout() {
  const { isAuthenticated, ready } = useAuth();

  if (!ready) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ backgroundImage: "var(--gradient-primary)", boxShadow: "var(--shadow-elegant)" }}
          >
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">Stratega</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua vida financeira, simplificada.
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}


