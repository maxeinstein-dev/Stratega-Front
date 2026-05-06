import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Plus, ArrowLeftRight, Download, Upload } from "lucide-react";
import { api, formatCurrency, ApiError, API_BASE, tokenStore } from "../../core/api";
import { useAuth } from "../../core/auth";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { GroupExpenseForm } from "../groups/components/GroupExpenseForm";

export default function TransactionsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [groupExpenseEnabled, setGroupExpenseEnabled] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [memberNamesInput, setMemberNamesInput] = useState("");

  const wallets = useQuery({
    queryKey: ["wallets", user?.id],
    queryFn: () => api("/wallets"),
    enabled: !!user?.id,
  });

  const groups = useQuery({
    queryKey: ["groups", user?.id],
    queryFn: () => api("/groups"),
    enabled: !!user?.id,
  });

  const txs = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: () => api("/transactions"),
    enabled: !!user?.id,
  });

  const selectedGroup = useMemo(
    () => groups.data?.find((group) => group.id === selectedGroupId),
    [groups.data, selectedGroupId]
  );

  useEffect(() => {
    if (!groupExpenseEnabled) return;
    if (selectedGroupId || !(groups.data?.length ?? 0)) return;
    setSelectedGroupId(groups.data?.[0]?.id ?? "");
  }, [groupExpenseEnabled, groups.data, selectedGroupId]);

  const createGroup = useMutation({
    mutationFn: () =>
      api("/groups", {
        method: "POST",
        body: JSON.stringify({
          name: groupName.trim(),
          memberNames: parseMemberNames(memberNamesInput),
        }),
      }),
    onSuccess: (group) => {
      toast.success("Grupo criado");
      qc.invalidateQueries({ queryKey: ["groups"] });
      setSelectedGroupId(group.id);
      setGroupExpenseEnabled(true);
      setCreatingGroup(false);
      setGroupName("");
      setMemberNamesInput("");
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Falha"),
  });

  const handleExport = async () => {
    try {
      const now = new Date();
      const res = await fetch(`${API_BASE}/transactions/export?month=${now.getMonth()+1}&year=${now.getFullYear()}`, {
        headers: {
          'Authorization': `Bearer ${tokenStore.get()}`
        }
      });
      if (!res.ok) throw new Error("Falha ao exportar");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stratega_transacoes_${now.getMonth()+1}_${now.getFullYear()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Exportação concluída");
    } catch (err) {
      toast.error("Erro ao exportar dados");
    }
  };

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["wallets"] });
    qc.invalidateQueries({ queryKey: ["groups"] });
    qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Transações</h1>
          <p className="text-sm text-muted-foreground">
            Receitas, despesas, transferências e divisões de grupo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" /> Exportar
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" /> Importar
          </Button>
          <Dialog
            open={open}
            onOpenChange={(value) => {
              setOpen(value);
              if (!value) {
                setGroupExpenseEnabled(false);
                setCreatingGroup(false);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Nova
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar aos registros</DialogTitle>
                <DialogDescription>
                  Registre uma nova receita, despesa ou transferência entre suas carteiras.
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="entry">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="entry">Receita / Despesa</TabsTrigger>
                  <TabsTrigger value="transfer">Transferência</TabsTrigger>
                </TabsList>
                <TabsContent value="entry">
                  <EntryForm
                    userId={user?.id ?? ""}
                    wallets={wallets.data ?? []}
                    groups={groups.data ?? []}
                    selectedGroup={selectedGroup}
                    groupExpenseEnabled={groupExpenseEnabled}
                    setGroupExpenseEnabled={setGroupExpenseEnabled}
                    selectedGroupId={selectedGroupId}
                    setSelectedGroupId={setSelectedGroupId}
                    creatingGroup={creatingGroup}
                    setCreatingGroup={setCreatingGroup}
                    groupName={groupName}
                    setGroupName={setGroupName}
                    memberNamesInput={memberNamesInput}
                    setMemberNamesInput={setMemberNamesInput}
                    onCreateGroup={() => createGroup.mutate()}
                    createGroupPending={createGroup.isPending}
                    onDone={() => {
                      setOpen(false);
                      setGroupExpenseEnabled(false);
                      invalidate();
                    }}
                  />
                </TabsContent>
                <TabsContent value="transfer">
                  <TransferForm
                    wallets={wallets.data ?? []}
                    onDone={() => {
                      setOpen(false);
                      invalidate();
                    }}
                  />
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Extrato</DialogTitle>
            <DialogDescription>
              Selecione um arquivo CSV ou OFX para importar suas transações automaticamente.
            </DialogDescription>
          </DialogHeader>
          <ImportForm wallets={wallets.data ?? []} onDone={() => { setImportOpen(false); invalidate(); }} />
        </DialogContent>
      </Dialog>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {txs.isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Carregando…</p>
        ) : (txs.data ?? []).length === 0 ? (
          <p className="p-12 text-center text-sm text-muted-foreground">Nenhuma transação ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(txs.data ?? []).map((t) => {
              const wallet = wallets.data?.find((w) => w.id === t.walletId);
              const income = t.type === "INCOME";
              return (
                <li key={t.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                  <div
                    className={`grid h-10 w-10 place-items-center rounded-full ${income ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}
                  >
                    {income ? (
                      <ArrowDownLeft className="h-5 w-5" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.date).toLocaleString('pt-BR')} {wallet ? `• ${wallet.name}` : ""}
                    </p>
                  </div>
                  <span
                    className={`font-mono text-sm font-semibold ${income ? "text-success" : "text-destructive"}`}
                  >
                    {income ? "+" : "−"}
                    {formatCurrency(t.amount)}
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

function ImportForm({ wallets, onDone }) {
  const [file, setFile] = useState(null);
  const [walletId, setWalletId] = useState(wallets[0]?.id || "");
  const [loading, setLoading] = useState(false);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file || !walletId) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("walletId", walletId);

    try {
      await api("/transactions/import", {
        method: "POST",
        body: formData,
        // Don't set Content-Type header for FormData, let the browser do it with boundary
        headers: {}
      });
      toast.success("Importação realizada com sucesso!");
      onDone();
    } catch (err) {
      toast.error(err.message || "Erro na importação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleImport} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Carteira de Destino</Label>
        <Select value={walletId} onValueChange={setWalletId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Arquivo (CSV ou OFX)</Label>
        <Input type="file" accept=".csv,.ofx" onChange={(e) => setFile(e.target.files[0])} />
      </div>
      <Button type="submit" className="w-full" disabled={loading || !file}>
        {loading ? "Processando..." : "Importar Agora"}
      </Button>
    </form>
  );
}

function EntryForm({
  userId,
  wallets,
  groups,
  selectedGroup,
  groupExpenseEnabled,
  setGroupExpenseEnabled,
  selectedGroupId,
  setSelectedGroupId,
  creatingGroup,
  setCreatingGroup,
  groupName,
  setGroupName,
  memberNamesInput,
  setMemberNamesInput,
  onCreateGroup,
  createGroupPending,
  onDone,
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("EXPENSE");
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
  const [date, setDate] = useState(() => toLocalDateTimeValue(new Date()));

  useEffect(() => {
    if (!walletId && wallets.length > 0) {
      setWalletId(wallets[0].id);
    }
  }, [walletId, wallets]);

  const m = useMutation({
    mutationFn: () =>
      api("/transactions", {
        method: "POST",
        body: JSON.stringify({
          description,
          amount: Number(amount),
          date: toIsoString(date),
          type,
          walletId,
        }),
      }),
    onSuccess: () => {
      toast.success("Transação adicionada");
      onDone();
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Falha"),
  });

  return (
    <div className="mt-4 space-y-4 animate-in slide-in-from-bottom-2">
      <Label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
        <Checkbox
          checked={groupExpenseEnabled}
          onCheckedChange={(checked) => setGroupExpenseEnabled(checked === true)}
        />
        <span>Essa transação faz parte de um grupo?</span>
      </Label>

      {groupExpenseEnabled ? (
        <div className="space-y-4 rounded-2xl border border-border p-4 bg-muted/20">
          <div className="space-y-2">
            <Label>Grupo</Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Você pode usar um grupo existente ou criar um novo agora.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCreatingGroup(!creatingGroup)}
            >
              {creatingGroup ? "Cancelar" : "Novo grupo"}
            </Button>
          </div>

          {creatingGroup && (
            <GroupInlineCreateForm
              groupName={groupName}
              setGroupName={setGroupName}
              memberNamesInput={memberNamesInput}
              setMemberNamesInput={setMemberNamesInput}
              onCreate={onCreateGroup}
              isPending={createGroupPending}
            />
          )}

          {selectedGroup ? (
            <GroupExpenseForm
              groupId={selectedGroup.id}
              members={selectedGroup.members ?? []}
              currentUserId={userId}
              onDone={onDone}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Selecione um grupo para continuar.
            </p>
          )}
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            m.mutate();
          }}
        >
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Almoço, Salário, etc" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                required
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                required
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Despesa</SelectItem>
                  <SelectItem value="INCOME">Receita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Carteira</Label>
              <Select value={walletId} onValueChange={setWalletId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma carteira" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full mt-2" disabled={m.isPending || !walletId}>
            {m.isPending ? "Salvando…" : "Salvar Transação"}
          </Button>
        </form>
      )}
    </div>
  );
}

function GroupInlineCreateForm({
  groupName,
  setGroupName,
  memberNamesInput,
  setMemberNamesInput,
  onCreate,
  isPending,
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-dashed border-border p-4 bg-background/50">
      <div className="space-y-2">
        <Label>Nome do grupo</Label>
        <Input
          required
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Ex: Viagem, Aluguel"
        />
      </div>
      <div className="space-y-2">
        <Label>Membros</Label>
        <Input
          value={memberNamesInput}
          onChange={(e) => setMemberNamesInput(e.target.value)}
          placeholder="Alice, Bob, Carla"
        />
        <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Separe os nomes por vírgula.</p>
      </div>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={onCreate}
        disabled={isPending}
      >
        {isPending ? "Criando…" : "Criar grupo"}
      </Button>
    </div>
  );
}

function TransferForm({ wallets, onDone }) {
  const [originWalletId, setOrigin] = useState(wallets[0]?.id ?? "");
  const [destinationWalletId, setDest] = useState(wallets[1]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("Transferência");

  const m = useMutation({
    mutationFn: () =>
      api("/transactions/transfer", {
        method: "POST",
        body: JSON.stringify({
          originWalletId,
          destinationWalletId,
          amount: Number(amount),
          description,
          date: new Date().toISOString(),
        }),
      }),
    onSuccess: () => {
      toast.success("Transferência concluída");
      onDone();
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Falha"),
  });

  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        m.mutate();
      }}
    >
      <div className="grid grid-cols-2 items-end gap-3">
        <div className="space-y-2">
          <Label>De (Origem)</Label>
          <Select value={originWalletId} onValueChange={setOrigin}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {wallets.map((wallet) => (
                <SelectItem key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Para (Destino)</Label>
          <Select value={destinationWalletId} onValueChange={setDest}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {wallets.map((wallet) => (
                <SelectItem key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-center py-2">
        <div className="rounded-full bg-muted p-2">
          <ArrowLeftRight className="h-4 w-4 text-primary" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Valor</Label>
        <Input
          required
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Descrição (Opcional)</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={m.isPending || originWalletId === destinationWalletId}
      >
        {m.isPending ? "Transferindo…" : "Concluir Transferência"}
      </Button>
    </form>
  );
}

function toLocalDateTimeValue(date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIsoString(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function parseMemberNames(input) {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}


