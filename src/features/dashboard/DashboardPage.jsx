import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingUp, TrendingDown, Target, Sparkles, PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from "recharts";
import { api, formatCurrency } from "../../core/api";
import { useAuth } from "../../core/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [days, setDays] = useState(180);
  
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const summary = useQuery({
    queryKey: ["dashboard-summary", month, year],
    queryFn: () => api(`/dashboard/summary?month=${month}&year=${year}`),
    enabled: !!isAuthenticated,
  });

  const historical = useQuery({
    queryKey: ["dashboard-historical", days],
    queryFn: () => api(`/dashboard/historical?days=${days}`),
    enabled: !!isAuthenticated,
  });

  const budgets = useQuery({
    queryKey: ["budgets", month, year],
    queryFn: () => api(`/budgets?month=${month}&year=${year}`),
    enabled: !!isAuthenticated,
  });

  const goals = useQuery({
    queryKey: ["goals"],
    queryFn: () => api(`/goals`),
    enabled: !!isAuthenticated,
  });

  const wallets = useQuery({
    queryKey: ["wallets"],
    queryFn: () => api("/wallets"),
    enabled: !!isAuthenticated,
  });

  const totalBalance = (wallets.data ?? []).reduce((s, w) => s + w.balance, 0);
  const name = user?.name ? user.name.split(" ")[0] : "Usuário";

  // Data transformations for charts
  const categoryData = Object.entries(summary.data?.expensesByCategory ?? {}).map(([name, value]) => ({ name, value }));
  
  const budgetData = (budgets.data ?? []).map(b => ({
    name: b.categoryName,
    Orçado: b.amountLimit,
    Realizado: (b.amountLimit * b.percentageUsed) / 100
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Resumo Financeiro</p>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight">
            Olá, {name} <span className="text-primary">.</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Período:</span>
          <Select value={days.toString()} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[160px] bg-card border-border">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Últimos 30 Dias</SelectItem>
              <SelectItem value="90">Últimos 3 Meses</SelectItem>
              <SelectItem value="180">Últimos 6 Meses</SelectItem>
              <SelectItem value="365">Último Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Main Stats (Current Month / Global) */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard 
          icon={Wallet} 
          label="Patrimônio Total" 
          value={formatCurrency(totalBalance)} 
          description="Soma de todas as suas carteiras"
          accent 
        />
        <StatCard
          icon={TrendingUp}
          label="Receitas (Mês Atual)"
          value={formatCurrency(summary.data?.totalIncome ?? 0)}
          tone="success"
          description="Total de entradas no mês corrente"
        />
        <StatCard
          icon={TrendingDown}
          label="Despesas (Mês Atual)"
          value={formatCurrency(summary.data?.totalExpense ?? 0)}
          tone="danger"
          description="Total de saídas no mês corrente"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Faturamento x Despesas Pessoais */}
        <Card className="border-none shadow-elegant bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Faturamento x Despesas Pessoais
            </CardTitle>
            <CardDescription>Comparativo histórico ({days} dias)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historical.data?.periods ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="periodLabel" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} width={60} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  itemStyle={{ fontSize: 13 }}
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold", marginBottom: 4 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="income" name="Faturamento" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Poupança Mensal */}
        <Card className="border-none shadow-elegant bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <LineChartIcon className="h-4 w-4 text-primary" />
              Evolução da Poupança
            </CardTitle>
            <CardDescription>Saldo líquido mensal acumulado (Receitas - Despesas)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historical.data?.periods ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="periodLabel" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} width={60} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Line type="monotone" dataKey="savings" name="Poupança" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Despesas por Categoria */}
        <Card className="border-none shadow-elegant bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              Despesas por Categoria
            </CardTitle>
            <CardDescription>Distribuição de gastos no mês corrente</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full flex items-center justify-center">
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma despesa registrada.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val) => formatCurrency(val)} 
                    contentStyle={{ borderRadius: "8px", border: "none", backgroundColor: "hsl(var(--card))", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  />
                  <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Projetado x Realizado */}
        <Card className="border-none shadow-elegant bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Projetado x Realizado
            </CardTitle>
            <CardDescription>Acompanhamento dos orçamentos (Budgets)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            {budgetData.length === 0 ? (
              <p className="text-sm text-muted-foreground flex h-full items-center justify-center">Nenhum orçamento configurado.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={budgetData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                  <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(val) => formatCurrency(val)}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Orçado" fill="hsl(var(--primary))" fillOpacity={0.3} barSize={20} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Realizado" fill="hsl(var(--primary))" barSize={20} radius={[0, 4, 4, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
         {/* Objetivos / Metas em Andamento */}
         <Card className="md:col-span-2 lg:col-span-2 border-none shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Objetivos de Poupança</CardTitle>
                <CardDescription className="mt-1 text-xs">Metas financeiras em andamento</CardDescription>
              </div>
              <Sparkles className="h-5 w-5 text-primary opacity-50" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(goals.data ?? []).map((g) => (
                  <div key={g.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{g.name}</span>
                      <span className="text-muted-foreground">{formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}</span>
                    </div>
                    <Progress value={g.percentageCompleted} className="h-2" />
                  </div>
                ))}
                {(!goals.data || goals.data.length === 0) && (
                  <p className="py-4 text-center text-sm text-muted-foreground italic">Nenhum objetivo de poupança criado.</p>
                )}
              </div>
            </CardContent>
         </Card>

         {/* Tip Card */}
         <Card className="md:col-span-2 lg:col-span-2 border-none shadow-elegant bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Dica Stratega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Acompanhe o seu gráfico de <strong>Evolução da Poupança</strong> ajustando o filtro de período acima. 
                Sempre que sua linha se mantiver positiva e crescente, significa que sua saúde financeira está melhorando!
              </p>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, description, accent, tone, trend }) {
  const isPositive = trend > 0;
  
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-elegant transition-all hover:shadow-hover"
      style={accent ? { backgroundImage: "var(--gradient-surface)" } : {}}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
          <h3 className={`mt-2 font-display text-3xl font-bold tracking-tight ${
            tone === "success" ? "text-success" : tone === "danger" ? "text-destructive" : "text-foreground"
          }`}>
            {value}
          </h3>
        </div>
        <div className={`rounded-2xl p-3 ${accent ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-2">
        <p className="text-[10px] text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
