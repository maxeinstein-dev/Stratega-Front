import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Wallet, Users, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/dashboard" });
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className="relative overflow-hidden"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ backgroundImage: "var(--gradient-primary)" }}>
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">Stratega</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost">Sign in</Button></Link>
            <Link to="/register"><Button>Get started</Button></Link>
          </nav>
        </header>

        <section className="mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Personal & group finance, simplified
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Money that <span style={{ backgroundImage: "var(--gradient-primary)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>moves with you.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Track wallets, log transactions, and split shared expenses with friends — Stratega settles
              debts in the fewest possible transfers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg" className="gap-2">
                  Create your account <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login"><Button size="lg" variant="outline">I already have an account</Button></Link>
            </div>
          </div>

          <div className="mt-20 grid gap-4 md:grid-cols-3">
            {[
              { icon: Wallet, title: "Multi-wallet", body: "Cash, bank, credit cards — even negative balances for invoices." },
              { icon: TrendingUp, title: "Income vs Expense", body: "Auto-balanced wallets, transfers, and category insights." },
              { icon: Users, title: "Split smartly", body: "Equal, exact, percentage, or shares — with debt settlement." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur transition hover:border-primary/40">
                <f.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
