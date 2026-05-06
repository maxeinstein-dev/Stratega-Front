import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "../../../core/api";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

function normalizeMember(member) {
  if (typeof member === "string") {
    return { id: member, name: member };
  }
  return member;
}

function toLocalDateTimeValue(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIsoString(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function GroupExpenseForm({
  groupId,
  members,
  onDone,
  currentUserId,
}) {
  const normalizedMembers = useMemo(() => members.map(normalizeMember), [members]);
  const memberIds = useMemo(
    () => new Set(normalizedMembers.map((member) => member.id)),
    [normalizedMembers],
  );
  const defaultPayerId =
    currentUserId && memberIds.has(currentUserId)
      ? currentUserId
      : (normalizedMembers[0]?.id ?? "");
      
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => toLocalDateTimeValue());
  const [paidByMemberId, setPaidByMemberId] = useState(defaultPayerId);
  const [splitType, setSplitType] = useState("UNIFORM");
  const [splitValues, setSplitValues] = useState({});

  useEffect(() => {
    if (!paidByMemberId || !memberIds.has(paidByMemberId)) {
      setPaidByMemberId(defaultPayerId);
    }
  }, [defaultPayerId, memberIds, paidByMemberId]);

  useEffect(() => {
    setSplitValues({});
  }, [splitType, normalizedMembers]);

  const resolvedSplitValues = useMemo(
    () =>
      buildResolvedSplitValues({
        members: normalizedMembers,
        amount: Number(amount),
        splitType,
        splitValues,
      }),
    [amount, normalizedMembers, splitType, splitValues],
  );

  const m = useMutation({
    mutationFn: () => {
      return api(`/groups/${groupId}/expenses`, {
        method: "POST",
        body: JSON.stringify({
          description,
          amount: Number(amount),
          date: toIsoString(date),
          paidByMemberId,
          splitType,
          splitValues: resolvedSplitValues,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Despesa em grupo adicionada");
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
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Jantar, Táxi, Hotel" />
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

      <div className="space-y-2">
        <Label>Quem pagou?</Label>
        <Select value={paidByMemberId} onValueChange={setPaidByMemberId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione quem pagou" />
          </SelectTrigger>
          <SelectContent>
            {normalizedMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Tipo de divisão</Label>
        <Select value={splitType} onValueChange={(value) => setSplitType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UNIFORM">Igualitária</SelectItem>
            <SelectItem value="EXACT">Valores exatos</SelectItem>
            <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
            <SelectItem value="SHARE">Cotas (Peso)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          {splitType === "UNIFORM" && "Divisão igual entre todos."}
          {splitType === "EXACT" && "Defina valores específicos por pessoa."}
          {splitType === "PERCENTAGE" && "Defina a porcentagem (deve somar 100%)."}
          {splitType === "SHARE" && "Defina o número de cotas por pessoa."}
        </p>
        {normalizedMembers.map((member) => (
          <div key={member.id} className="flex items-center gap-3">
            <span className="flex-1 text-sm font-medium">{member.name}</span>
            <Input
              type="number"
              step="0.01"
              className="w-24 h-8 text-sm"
              value={splitValues[member.id] ?? resolvedSplitValues[member.id] ?? ""}
              onChange={(e) => {
                const nextValue = e.target.value;
                setSplitValues((current) => ({ ...current, [member.id]: nextValue }));
              }}
            />
          </div>
        ))}
      </div>

      <Button type="submit" className="w-full mt-2" disabled={m.isPending || !paidByMemberId}>
        {m.isPending ? "Salvando…" : "Lançar Despesa no Grupo"}
      </Button>
    </form>
  );
}

function buildResolvedSplitValues({
  members,
  amount,
  splitType,
  splitValues,
}) {
  const resolved = {};
  const explicitValues = new Map();

  for (const member of members) {
    const raw = splitValues[member.id];
    if (raw === undefined || raw === "") continue;
    const parsed = Number(raw);
    explicitValues.set(member.id, Number.isNaN(parsed) ? 0 : parsed);
  }

  if (splitType === "SHARE") {
    for (const member of members) {
      resolved[member.id] = explicitValues.has(member.id)
        ? (explicitValues.get(member.id) ?? 0)
        : 1;
    }
    return resolved;
  }

  const total = splitType === "PERCENTAGE" ? 100 : amount;
  const explicitTotal = Array.from(explicitValues.values()).reduce((sum, value) => sum + value, 0);
  const blankMembers = members.filter((member) => !explicitValues.has(member.id));
  const remaining = Math.max(total - explicitTotal, 0);
  const filledValue = blankMembers.length > 0 ? remaining / blankMembers.length : 0;

  for (const member of members) {
    resolved[member.id] = explicitValues.has(member.id)
      ? (explicitValues.get(member.id) ?? 0)
      : filledValue;
  }

  return resolved;
}


