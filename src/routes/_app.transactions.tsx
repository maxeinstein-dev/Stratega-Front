import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Plus, ArrowLeftRight } from "lucide-react";
import { api, formatCurrency, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_app/transactions")({
  head: () => ({ meta: [{ title: "Transactions — Stratega" }] }),
  component: TransactionsPage,
});

type WalletT = { id: string; name: string; balance: number };
type Tx = { id: string; description: string; amount: number; type: "INCOME" | "EXPENSE"; date: string; walletId: string };

function TransactionsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

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

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["wallets"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">Income, expenses, and transfers across your wallets.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add to your books</DialogTitle></DialogHeader>
            <Tabs defaultValue="entry">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="entry">Income / Expense</TabsTrigger>
                <TabsTrigger value="transfer">Transfer</TabsTrigger>
              </TabsList>
              <TabsContent value="entry">
                <EntryForm
                  userId={user?.id ?? ""}
                  wallets={wallets.data ?? []}
                  onDone={() => { setOpen(false); invalidate(); }}
                />
              </TabsContent>
              <TabsContent value="transfer">
                <TransferForm
                  wallets={wallets.data ?? []}
                  onDone={() => { setOpen(false); invalidate(); }}
                />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        {txs.isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : (txs.data ?? []).length === 0 ? (
          <p className="p-12 text-center text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(txs.data ?? []).map((t) => {
              const wallet = wallets.data?.find((w) => w.id === t.walletId);
              const income = t.type === "INCOME";
              return (
                <li key={t.id} className="flex items-center gap-4 px-5 py-4">
                  <div className={`grid h-10 w-10 place-items-center rounded-full ${income ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                    {income ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.date).toLocaleString()} {wallet ? `• ${wallet.name}` : ""}
                    </p>
                  </div>
                  <span className={`font-mono text-sm ${income ? "text-success" : "text-destructive"}`}>
                    {income ? "+" : "−"}{formatCurrency(t.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function EntryForm({ userId, wallets, onDone }: { userId: string; wallets: WalletT[]; onDone: () => void }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [walletId, setWalletId] = useState<string>(wallets[0]?.id ?? "");

  const m = useMutation({
    mutationFn: () =>
      api("/api/transactions", {
        method: "POST",
        userId,
        body: JSON.stringify({
          description,
          amount: Number(amount),
          date: new Date().toISOString(),
          type,
          walletId,
        }),
      }),
    onSuccess: () => { toast.success("Transaction added"); onDone(); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed"),
  });

  return (
    <form className="mt-4 space-y-4" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input required value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input required type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EXPENSE">Expense</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Wallet</Label>
        <Select value={walletId} onValueChange={setWalletId}>
          <SelectTrigger><SelectValue placeholder="Choose a wallet" /></SelectTrigger>
          <SelectContent>
            {wallets.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={m.isPending || !walletId}>
        {m.isPending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

function TransferForm({ wallets, onDone }: { wallets: WalletT[]; onDone: () => void }) {
  const [originWalletId, setOrigin] = useState(wallets[0]?.id ?? "");
  const [destinationWalletId, setDest] = useState(wallets[1]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("Transfer");

  const m = useMutation({
    mutationFn: () =>
      api("/api/transactions/transfer", {
        method: "POST",
        body: JSON.stringify({
          originWalletId,
          destinationWalletId,
          amount: Number(amount),
          description,
          date: new Date().toISOString(),
        }),
      }),
    onSuccess: () => { toast.success("Transfer complete"); onDone(); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed"),
  });

  return (
    <form className="mt-4 space-y-4" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
      <div className="grid grid-cols-2 items-end gap-3">
        <div className="space-y-2">
          <Label>From</Label>
          <Select value={originWalletId} onValueChange={setOrigin}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {wallets.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>To</Label>
          <Select value={destinationWalletId} onValueChange={setDest}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {wallets.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-center text-muted-foreground"><ArrowLeftRight className="h-4 w-4" /></div>
      <div className="space-y-2">
        <Label>Amount</Label>
        <Input required type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={m.isPending || originWalletId === destinationWalletId}>
        {m.isPending ? "Transferring…" : "Transfer"}
      </Button>
    </form>
  );
}
