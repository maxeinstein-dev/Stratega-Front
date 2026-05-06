import { useParams, Link, useNavigate } from "react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, ArrowRight, CheckCircle2, Trash2, History, Receipt } from "lucide-react";
import { api, formatCurrency, ApiError } from "../../core/api";
import { useAuth } from "../../core/auth";
import { Button } from "../../components/ui/button";
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
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import { GroupExpenseForm } from "./components/GroupExpenseForm";

export default function GroupDetailsPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);

  const group = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => api(`/groups/${groupId}`),
  });

  const deleteGroup = useMutation({
    mutationFn: () => api(`/groups/${groupId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Grupo excluído com sucesso");
      qc.invalidateQueries({ queryKey: ["groups"] });
      navigate("/groups");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Falha ao excluir grupo")
  });

  const balances = useQuery({
    queryKey: ["group", groupId, "balances"],
    queryFn: () => api(`/groups/${groupId}/balances`),
  });

  const wallets = useQuery({
    queryKey: ["wallets"],
    queryFn: () => api("/wallets"),
  });

  const movements = useQuery({
    queryKey: ["group", groupId, "movements"],
    queryFn: () => api(`/groups/${groupId}/movements`),
  });

  const members = useMemo(() => normalizeMembers(group.data?.members ?? []), [group.data?.members]);
  const memberById = useMemo(
    () => Object.fromEntries(members.map((member) => [member.id, member])),
    [members],
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link
        to="/groups"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para Grupos
      </Link>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {group.data?.name ?? "Grupo"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {members.length} membro{members.length === 1 ? "" : "s"} participando
          </p>
        </div>
        <div className="flex items-center gap-2">
          {group.data?.ownerId === currentUser?.id && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive transition-colors"
              onClick={() => {
                if (confirm("Tem certeza que deseja excluir este grupo?")) {
                  deleteGroup.mutate();
                }
              }}
              disabled={deleteGroup.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}

           <Dialog open={settleOpen} onOpenChange={setSettleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={members.length === 0}>
                <CheckCircle2 className="h-4 w-4 text-success" /> Liquidar Dívida
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Liquidar Dívida de Grupo</DialogTitle>
              </DialogHeader>
              <SettleForm 
                groupId={groupId} 
                members={members} 
                wallets={wallets.data ?? []} 
                onDone={() => {
                  setSettleOpen(false);
                  qc.invalidateQueries({ queryKey: ["group", groupId, "balances"] });
                  qc.invalidateQueries({ queryKey: ["group", groupId, "movements"] });
                  qc.invalidateQueries({ queryKey: ["wallets"] });
                }} 
              />
            </DialogContent>
          </Dialog>

          <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-elegant" disabled={members.length === 0}>
                <Plus className="h-4 w-4" /> Nova Despesa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Lançar Despesa Coletiva</DialogTitle>
              </DialogHeader>
              <GroupExpenseForm
                groupId={groupId}
                members={members}
                currentUserId={currentUser?.id}
                onDone={() => {
                  setExpenseOpen(false);
                  qc.invalidateQueries({ queryKey: ["group", groupId, "balances"] });
                  qc.invalidateQueries({ queryKey: ["group", groupId, "movements"] });
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Balances Card */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-elegant">
          <h2 className="font-display text-lg font-bold tracking-tight">Balanço do Grupo</h2>
          <ul className="mt-4 space-y-1 divide-y divide-border">
            {Object.entries(balances.data?.memberBalances ?? {}).map(([id, value]) => (
              <li key={id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                   <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold uppercase tracking-tighter">
                      {memberById[id]?.name?.substring(0, 2) || "U"}
                   </div>
                   <span className="text-sm font-medium">{memberById[id]?.name ?? id}</span>
                </div>
                <span
                  className={`font-mono text-sm font-bold ${value > 0 ? "text-success" : value < 0 ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {value > 0 ? "Receber " : value < 0 ? "Pagar " : ""}
                  {formatCurrency(Math.abs(value))}
                </span>
              </li>
            ))}
            {Object.keys(balances.data?.memberBalances ?? {}).length === 0 && (
              <li className="py-12 text-center text-sm text-muted-foreground bg-muted/5 rounded-2xl border border-dashed border-border mt-4">
                Ainda não há despesas registradas.
              </li>
            )}
          </ul>
        </div>

        {/* Transfers Card */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-elegant">
          <h2 className="font-display text-lg font-bold tracking-tight">Transferências Sugeridas</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Cálculo otimizado para fechar as contas com menos operações.
          </p>
          <ul className="mt-5 space-y-3">
            {(balances.data?.suggestedTransfers ?? []).map((transfer, index) => (
              <li
                key={index}
                className="group flex items-center justify-between rounded-2xl border border-border bg-muted/20 px-5 py-4 transition-all hover:bg-muted/30"
              >
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-bold text-primary">{transfer.from.name}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground animate-pulse" />
                  <span className="font-bold text-foreground">{transfer.to.name}</span>
                </div>
                <span className="font-mono text-sm font-bold text-primary">
                  {formatCurrency(transfer.amount)}
                </span>
              </li>
            ))}
            {(balances.data?.suggestedTransfers ?? []).length === 0 && (
              <li className="rounded-2xl border border-dashed border-border py-12 text-center bg-muted/5">
                <p className="text-sm text-muted-foreground">Tudo certo! Sem dívidas pendentes.</p>
              </li>
            )}
          </ul>
        </div>
      </section>

      {/* Movements History Section */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-elegant">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight">Histórico de Atividades</h2>
              <p className="text-sm text-muted-foreground">Gastos e acertos realizados no grupo</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {movements.data?.map((mv) => (
            <div 
              key={mv.id} 
              className="group flex items-center justify-between p-4 rounded-2xl border border-border bg-muted/5 transition-all hover:bg-muted/10 hover:border-primary/20"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${mv.type === 'SETTLEMENT' ? 'bg-success/10' : 'bg-primary/10'}`}>
                  <Receipt className={`h-4 w-4 ${mv.type === 'SETTLEMENT' ? 'text-success' : 'text-primary'}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {mv.description}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Pago por <span className="text-foreground">{mv.paidByName}</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">•</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(mv.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-sm font-mono font-bold ${mv.type === 'SETTLEMENT' ? 'text-success' : 'text-foreground'}`}>
                  {mv.type === 'SETTLEMENT' ? '+' : ''} {formatCurrency(mv.amount)}
                </span>
                {mv.type === 'SETTLEMENT' && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-success/70 mt-0.5">Liquidação</p>
                )}
              </div>
            </div>
          ))}

          {(!movements.data || movements.data.length === 0) && (
            <div className="py-12 text-center rounded-2xl border border-dashed border-border bg-muted/5">
              <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada ainda.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SettleForm({ groupId, members, wallets, onDone }) {
  const [memberId, setMemberId] = useState(members[0]?.id || "");
  const [destinationWalletId, setWalletId] = useState(wallets[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("Acerto de contas no grupo");

  const m = useMutation({
    mutationFn: () => api(`/groups/${groupId}/settle`, {
      method: "POST",
      body: JSON.stringify({
        memberId,
        amount: Number(amount),
        destinationWalletId,
        description
      })
    }),
    onSuccess: () => {
      toast.success("Dívida liquidada e saldo atualizado na carteira!");
      onDone();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Falha na liquidação")
  });

  return (
    <form className="space-y-4 pt-4" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
      <div className="space-y-2">
        <Label>Quem está pagando?</Label>
        <Select value={memberId} onValueChange={setMemberId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor do Acerto</Label>
          <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Receber em</Label>
          <Select value={destinationWalletId} onValueChange={setWalletId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <Button type="submit" className="w-full mt-2" disabled={m.isPending || !memberId || !destinationWalletId}>
        {m.isPending ? "Processando..." : "Confirmar Recebimento"}
      </Button>
    </form>
  );
}

function normalizeMembers(members) {
  return members.map((member) =>
    typeof member === "string" ? { id: member, name: member } : member,
  );
}


