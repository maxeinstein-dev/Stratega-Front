import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Wallet as WalletIcon } from "lucide-react";
import { api, formatCurrency, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/wallets")({
  head: () => ({ meta: [{ title: "Wallets — Stratega" }] }),
  component: WalletsPage,
});

type WalletT = { id: string; name: string; balance: number; userId: string };

function WalletsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [initial, setInitial] = useState("0");

  const wallets = useQuery({
    queryKey: ["wallets", user?.id],
    queryFn: () => api<WalletT[]>(`/api/wallets?userId=${user?.id}`),
    enabled: !!user?.id,
  });

  const create = useMutation({
    mutationFn: () =>
      api<WalletT>("/api/wallets", {
        method: "POST",
        body: JSON.stringify({ name, initialBalance: Number(initial) || 0, userId: user?.id }),
      }),
    onSuccess: () => {
      toast.success("Wallet created");
      setOpen(false);
      setName(""); setInitial("0");
      qc.invalidateQueries({ queryKey: ["wallets"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to create wallet"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Wallets</h1>
          <p className="text-sm text-muted-foreground">All your accounts in one place.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New wallet</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create wallet</DialogTitle></DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
            >
              <div className="space-y-2">
                <Label>Name</Label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Checking, Cash, Visa…" />
              </div>
              <div className="space-y-2">
                <Label>Initial balance</Label>
                <Input type="number" step="0.01" value={initial} onChange={(e) => setInitial(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={create.isPending}>
                {create.isPending ? "Creating…" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {wallets.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (wallets.data ?? []).length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {wallets.data!.map((w) => (
            <div key={w.id} className="rounded-2xl border border-border bg-card p-5" style={{ backgroundImage: "var(--gradient-surface)" }}>
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                  <WalletIcon className="h-5 w-5" />
                </div>
                <span className="text-xs text-muted-foreground">Balance</span>
              </div>
              <p className="mt-4 font-display text-xl font-semibold">{w.name}</p>
              <p className={`mt-1 font-mono text-2xl ${w.balance < 0 ? "text-destructive" : "text-foreground"}`}>
                {formatCurrency(w.balance)}
              </p>
            </div>
          ))}
        </div>
      )}

      {wallets.error && (
        <p className="text-sm text-destructive">{(wallets.error as Error).message}</p>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border p-12 text-center">
      <WalletIcon className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-4 font-display text-lg">No wallets yet</p>
      <p className="text-sm text-muted-foreground">Create your first wallet to start tracking money.</p>
    </div>
  );
}
