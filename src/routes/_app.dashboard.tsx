import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingUp, TrendingDown, Users } from "lucide-react";
import { api, formatCurrency } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Stratega" }] }),
  component: Dashboard,
});

type WalletT = { id: string; name: string; balance: number };
type Tx = { id: string; description: string; amount: number; type: "INCOME" | "EXPENSE"; date: string; walletId: string };

function Dashboard() {
  const { user } = useAuth();

  const wallets = useQuery({
    queryKey: ["wallets", user?.id],
    queryFn: () => api<WalletT[]>(`/api/wallets?userId=${user?.id}`),
    enabled: !!user?.id,
  });

  const txs = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: () => api<Tx[]>(`/api/transactions?userId=${user?.id}`),
    enabled: !!user?.id,
  });

  const total = (wallets.data ?? []).reduce((s, w) => s + (w.balance ?? 0), 0);
  const income = (txs.data ?? []).filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const expense = (txs.data ?? []).filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{user?.name}</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Wallet} label="Total balance" value={formatCurrency(total)} accent />
        <StatCard icon={TrendingUp} label="Income" value={formatCurrency(income)} tone="success" />
        <StatCard icon={TrendingDown} label="Expense" value={formatCurrency(expense)} tone="danger" />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card title="Your wallets" empty={!wallets.isLoading && (wallets.data ?? []).length === 0} emptyText="No wallets yet — create one in Wallets.">
          <ul className="divide-y divide-border">
            {(wallets.data ?? []).slice(0, 5).map((w) => (
              <li key={w.id} className="flex items-center justify-between py-3">
                <span className="font-medium">{w.name}</span>
                <span className="font-mono text-sm">{formatCurrency(w.balance)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Recent transactions" empty={!txs.isLoading && (txs.data ?? []).length === 0} emptyText="No transactions yet.">
          <ul className="divide-y divide-border">
            {(txs.data ?? []).slice(0, 6).map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{t.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                </div>
                <span className={`font-mono text-sm ${t.type === "INCOME" ? "text-success" : "text-destructive"}`}>
                  {t.type === "INCOME" ? "+" : "−"}{formatCurrency(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <Card title="Tips">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2"><Users className="mt-0.5 h-4 w-4 text-primary" /> Create a Group to split a trip or shared bills with friends.</li>
          <li className="flex items-start gap-2"><Wallet className="mt-0.5 h-4 w-4 text-primary" /> Add a credit-card wallet — Stratega supports negative balances.</li>
        </ul>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent, tone }: { icon: any; label: string; value: string; accent?: boolean; tone?: "success" | "danger" }) {
  const color = tone === "success" ? "text-success" : tone === "danger" ? "text-destructive" : "text-foreground";
  return (
    <div
      className="rounded-2xl border border-border bg-card p-5"
      style={accent ? { backgroundImage: "var(--gradient-surface)", boxShadow: "var(--shadow-elegant)" } : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className={`mt-3 font-display text-2xl font-bold tracking-tight ${color}`}>{value}</p>
    </div>
  );
}

function Card({ title, children, empty, emptyText }: { title: string; children: React.ReactNode; empty?: boolean; emptyText?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-3">
        {empty ? <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p> : children}
      </div>
    </div>
  );
}
