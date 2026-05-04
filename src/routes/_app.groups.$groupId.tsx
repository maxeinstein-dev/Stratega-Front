import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Plus, ArrowRight } from "lucide-react";
import { api, formatCurrency, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_app/groups/$groupId")({
  head: () => ({ meta: [{ title: "Group — Stratega" }] }),
  component: GroupDetail,
});

type Member = { id: string; name: string };
type Group = { id: string; name: string; members: Member[] };
type Balances = {
  groupId: string;
  groupName: string;
  memberBalances: Record<string, number>;
  suggestedTransfers: { from: Member; to: Member; amount: number }[];
};
type SplitType = "UNIFORM" | "EXACT" | "PERCENTAGE" | "SHARE";

function GroupDetail() {
  const { groupId } = Route.useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const group = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => api<Group>(`/api/groups/${groupId}`),
  });

  const balances = useQuery({
    queryKey: ["group", groupId, "balances"],
    queryFn: () => api<Balances>(`/api/groups/${groupId}/balances`),
  });

  const members = group.data?.members ?? [];
  const memberById = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members]);

  return (
    <div className="space-y-6">
      <Link to="/groups" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{group.data?.name ?? "Group"}</h1>
          <p className="text-sm text-muted-foreground">{members.length} members</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={members.length === 0}><Plus className="h-4 w-4" /> Add expense</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New group expense</DialogTitle></DialogHeader>
            <ExpenseForm
              groupId={groupId}
              members={members}
              onDone={() => {
                setOpen(false);
                qc.invalidateQueries({ queryKey: ["group", groupId, "balances"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">Balances</h2>
          <ul className="mt-3 divide-y divide-border">
            {Object.entries(balances.data?.memberBalances ?? {}).map(([id, value]) => (
              <li key={id} className="flex items-center justify-between py-3">
                <span className="text-sm">{memberById[id]?.name ?? id}</span>
                <span className={`font-mono text-sm ${value > 0 ? "text-success" : value < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {value > 0 ? "+" : ""}{formatCurrency(value)}
                </span>
              </li>
            ))}
            {Object.keys(balances.data?.memberBalances ?? {}).length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">No expenses yet.</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">Suggested settlements</h2>
          <p className="text-xs text-muted-foreground">Smallest number of transfers to settle up.</p>
          <ul className="mt-3 space-y-2">
            {(balances.data?.suggestedTransfers ?? []).map((t, i) => (
              <li key={i} className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-4 py-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{t.from.name}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{t.to.name}</span>
                </div>
                <span className="font-mono text-sm text-primary">{formatCurrency(t.amount)}</span>
              </li>
            ))}
            {(balances.data?.suggestedTransfers ?? []).length === 0 && (
              <li className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                All settled up.
              </li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}

function ExpenseForm({ groupId, members, onDone }: { groupId: string; members: Member[]; onDone: () => void }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidByMemberId, setPaidBy] = useState(members[0]?.id ?? "");
  const [splitType, setSplitType] = useState<SplitType>("UNIFORM");
  const [splitValues, setSplitValues] = useState<Record<string, string>>({});

  const m = useMutation({
    mutationFn: () => {
      const values: Record<string, number> = {};
      if (splitType !== "UNIFORM") {
        for (const k of Object.keys(splitValues)) {
          const n = Number(splitValues[k]);
          if (!Number.isNaN(n)) values[k] = n;
        }
      }
      return api(`/api/groups/${groupId}/expenses`, {
        method: "POST",
        body: JSON.stringify({
          description,
          amount: Number(amount),
          paidByMemberId,
          splitType,
          splitValues: values,
        }),
      });
    },
    onSuccess: () => { toast.success("Expense added"); onDone(); },
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
          <Label>Paid by</Label>
          <Select value={paidByMemberId} onValueChange={setPaidBy}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {members.map((mb) => <SelectItem key={mb.id} value={mb.id}>{mb.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Split type</Label>
        <Select value={splitType} onValueChange={(v) => setSplitType(v as SplitType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="UNIFORM">Equal</SelectItem>
            <SelectItem value="EXACT">Exact amounts</SelectItem>
            <SelectItem value="PERCENTAGE">Percentage</SelectItem>
            <SelectItem value="SHARE">Shares</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {splitType !== "UNIFORM" && (
        <div className="space-y-2 rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground">
            {splitType === "EXACT" && "Enter the amount each member owes."}
            {splitType === "PERCENTAGE" && "Enter percentages — must sum to 100."}
            {splitType === "SHARE" && "Enter share count for each member."}
          </p>
          {members.map((mb) => (
            <div key={mb.id} className="flex items-center gap-3">
              <span className="flex-1 text-sm">{mb.name}</span>
              <Input
                type="number"
                step="0.01"
                className="w-32"
                value={splitValues[mb.id] ?? ""}
                onChange={(e) => setSplitValues({ ...splitValues, [mb.id]: e.target.value })}
              />
            </div>
          ))}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={m.isPending || !paidByMemberId}>
        {m.isPending ? "Saving…" : "Add expense"}
      </Button>
    </form>
  );
}
