import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Wallet as WalletIcon, Globe, AlertTriangle } from "lucide-react";
import { api, formatCurrency, ApiError } from "../../core/api";
import { useAuth } from "../../core/auth";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

const CURRENCIES = ["BRL", "USD", "EUR", "GBP", "BTC"];

export default function WalletsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [initial, setInitial] = useState("0");
  const [currency, setCurrency] = useState("BRL");
  const [allowNegativeBalance, setAllowNegativeBalance] = useState(true);

  const wallets = useQuery({
    queryKey: ["wallets", user?.id],
    queryFn: () => api("/wallets"),
    enabled: !!user?.id,
  });

  const create = useMutation({
    mutationFn: () =>
      api("/wallets", {
        method: "POST",
        body: JSON.stringify({ name, initialBalance: Number(initial) || 0, currency, allowNegativeBalance }),
      }),
    onSuccess: () => {
      toast.success("Carteira criada");
      setOpen(false);
      setName("");
      setInitial("0");
      setCurrency("BRL");
      setAllowNegativeBalance(true);
      qc.invalidateQueries({ queryKey: ["wallets"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Falha ao criar carteira"),
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Carteiras</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas contas, cartões e reservas.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-elegant transition-transform active:scale-95">
              <Plus className="h-4 w-4" /> Nova carteira
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar carteira</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4 pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate();
              }}
            >
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Conta Corrente, Nubank, Dinheiro..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Saldo inicial</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={initial}
                    onChange={(e) => setInitial(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Moeda</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Toggle: Permitir saldo negativo */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Permitir saldo negativo</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {allowNegativeBalance
                      ? "Saldo pode ficar negativo livremente"
                      : "O sistema alertará se o saldo ficar negativo"}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={allowNegativeBalance}
                  onClick={() => setAllowNegativeBalance(v => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    allowNegativeBalance ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform ${
                      allowNegativeBalance ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <Button type="submit" className="w-full mt-2" disabled={create.isPending}>
                {create.isPending ? "Criando…" : "Criar Carteira"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {wallets.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : (wallets.data ?? []).length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {wallets.data.map((w) => (
            <div
              key={w.id}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-elegant transition-all hover:shadow-hover"
              style={{ backgroundImage: "var(--gradient-surface)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <WalletIcon className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-2">
                  {!w.allowNegativeBalance && (
                    <span className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-warning">
                      <AlertTriangle className="h-3 w-3" />
                      Restrita
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    {w.currency || "BRL"}
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <p className="font-display text-xl font-bold tracking-tight">{w.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Saldo</p>
                <p
                  className={`mt-1 font-mono text-3xl font-bold ${w.balance < 0 ? "text-destructive" : "text-foreground"}`}
                >
                  {formatCurrency(w.balance, w.currency || "BRL")}
                </p>
              </div>
              <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors" />
            </div>
          ))}
        </div>
      )}

      {wallets.error && (
        <p className="text-sm text-destructive font-medium">Erro ao carregar carteiras: {wallets.error.message}</p>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border p-16 text-center bg-muted/10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <WalletIcon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-6 font-display text-xl font-bold">Nenhuma carteira ativa</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
        Comece criando uma carteira para organizar suas receitas e despesas.
      </p>
    </div>
  );
}


