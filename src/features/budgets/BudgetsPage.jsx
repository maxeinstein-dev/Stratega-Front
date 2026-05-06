import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Target, Plus, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { api, formatCurrency, ApiError } from "../../core/api";
import { useAuth } from "../../core/auth";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Progress } from "../../components/ui/progress";
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
import { toast } from "sonner";
import { Badge } from "../../components/ui/badge";

export default function BudgetsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const budgets = useQuery({
    queryKey: ["budgets", month, year],
    queryFn: () => api(`/budgets?month=${month}&year=${year}`),
    enabled: !!user?.id,
  });

  const categories = ["Alimentação", "Lazer", "Transporte", "Educação", "Saúde", "Moradia", "Outros"];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Metas de Gastos</h1>
          <p className="text-sm text-muted-foreground">Defina orçamentos mensais para suas categorias e mantenha o controle.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-elegant">
              <Plus className="h-4 w-4" /> Definir Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Meta Mensal</DialogTitle>
            </DialogHeader>
            <BudgetForm 
              categories={categories} 
              onDone={() => {
                setOpen(false);
                qc.invalidateQueries({ queryKey: ["budgets"] });
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {(budgets.data ?? []).map((budget) => (
          <div 
            key={budget.id} 
            className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-elegant transition-all hover:shadow-hover"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Target className="h-5 w-5" />
              </div>
              {budget.isOverBudget ? (
                <Badge variant="destructive" className="gap-1 animate-bounce">
                  <AlertTriangle className="h-3 w-3" /> Excedido
                </Badge>
              ) : (
                <Badge variant="success" className="gap-1 bg-success/10 text-success border-success/20">
                  <CheckCircle2 className="h-3 w-3" /> No Prazo
                </Badge>
              )}
            </div>

            <div className="mt-6">
              <h3 className="font-display text-xl font-bold tracking-tight">{budget.categoryName}</h3>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Consumido</p>
                  <p className="font-mono text-lg font-bold">{formatCurrency(budget.currentSpent)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Limite</p>
                  <p className="font-mono text-lg font-bold text-primary">{formatCurrency(budget.amountLimit)}</p>
                </div>
              </div>
              
              <div className="mt-4 space-y-1.5">
                <Progress 
                  value={budget.percentageUsed} 
                  className="h-2" 
                  indicatorClassName={budget.isOverBudget ? "bg-destructive" : budget.percentageUsed > 80 ? "bg-warning" : "bg-primary"}
                />
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                  <span>{budget.percentageUsed.toFixed(1)}% utilizado</span>
                  <span>{formatCurrency(Math.max(budget.amountLimit - budget.currentSpent, 0))} restante</span>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
          </div>
        ))}

        {(!budgets.data || budgets.data.length === 0) && !budgets.isLoading && (
          <div className="lg:col-span-3 rounded-3xl border border-dashed border-border p-20 text-center bg-muted/5">
            <Target className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-6 font-display text-xl font-bold">Nenhuma meta para este mês</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              Defina limites de gastos para suas categorias e acompanhe seu progresso em tempo real.
            </p>
            <Button variant="outline" className="mt-8" onClick={() => setOpen(true)}>Começar agora</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function BudgetForm({ categories, onDone }) {
  const [categoryName, setCategoryName] = useState(categories[0]);
  const [amountLimit, setAmountLimit] = useState("");
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const m = useMutation({
    mutationFn: () => api("/budgets", {
      method: "POST",
      body: JSON.stringify({
        categoryName,
        amountLimit: Number(amountLimit),
        month,
        year
      })
    }),
    onSuccess: () => {
      toast.success("Meta definida com sucesso");
      onDone();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Erro ao definir meta")
  });

  return (
    <form className="space-y-4 pt-4" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
      <div className="space-y-2">
        <Label>Categoria</Label>
        <Select value={categoryName} onValueChange={setCategoryName}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Limite Mensal (R$)</Label>
        <Input type="number" step="10" placeholder="Ex: 500" value={amountLimit} onChange={(e) => setAmountLimit(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Mês</Label>
          <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({length: 12}, (_, i) => (
                <SelectItem key={i+1} value={(i+1).toString()}>
                  {new Date(2026, i).toLocaleDateString('pt-BR', {month: 'long'})}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Ano</Label>
          <Input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value))} />
        </div>
      </div>
      <Button type="submit" className="w-full mt-2" disabled={m.isPending}>
        {m.isPending ? "Salvando..." : "Salvar Meta"}
      </Button>
    </form>
  );
}


