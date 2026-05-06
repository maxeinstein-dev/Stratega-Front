import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Users, X, ArrowRight } from "lucide-react";
import { api, ApiError } from "../../core/api";
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
import { Badge } from "../../components/ui/badge";

export default function GroupsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [members, setMembers] = useState([]);
  const [memberInput, setMemberInput] = useState("");

  const groups = useQuery({
    queryKey: ["groups", user?.id],
    queryFn: () => api("/groups"),
    enabled: !!user?.id,
  });

  const create = useMutation({
    mutationFn: () =>
      api("/groups", {
        method: "POST",
        body: JSON.stringify({ name, memberNames: members }),
      }),
    onSuccess: () => {
      toast.success("Grupo criado com sucesso");
      setOpen(false);
      setName("");
      setMembers([]);
      setMemberInput("");
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Falha ao criar grupo"),
  });

  function addMember() {
    const v = memberInput.trim();
    if (v && !members.includes(v)) setMembers([...members, v]);
    setMemberInput("");
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Grupos Sociais</h1>
          <p className="text-sm text-muted-foreground">
            Divida contas com amigos, acompanhe saldos e liquide dívidas.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-elegant">
              <Plus className="h-4 w-4" /> Criar novo grupo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Grupo de Despesas</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4 pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate();
              }}
            >
              <div className="space-y-2">
                <Label>Nome do Grupo</Label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Viagem de Férias, República, Churrasco"
                />
              </div>
              <div className="space-y-2">
                <Label>Adicionar Membros</Label>
                <div className="flex gap-2">
                  <Input
                    value={memberInput}
                    onChange={(e) => setMemberInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addMember();
                      }
                    }}
                    placeholder="Digite um nome e tecle Enter"
                  />
                  <Button type="button" variant="secondary" onClick={addMember}>
                    Add
                  </Button>
                </div>
                {members.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {members.map((m) => (
                      <Badge key={m} variant="secondary" className="gap-1 pl-3 pr-2 py-1 rounded-full">
                        {m}
                        <button
                          type="button"
                          className="hover:text-destructive transition-colors"
                          onClick={() => setMembers(members.filter((x) => x !== m))}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full mt-2" disabled={create.isPending}>
                {create.isPending ? "Criando…" : "Criar Grupo"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {groups.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1,2].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : (groups.data ?? []).length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-16 text-center bg-muted/5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-6 font-display text-xl font-bold">Nenhum grupo</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Divida sua primeira despesa criando um grupo agora.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.data.map((g) => (
            <Link
              key={g.id}
              to={`/groups/${g.id}`}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-elegant transition-all hover:border-primary/40 hover:shadow-hover"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold tracking-tight">{g.name}</h3>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                      {g.members?.length ?? 0} membro{(g.members?.length ?? 0) === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="rounded-full bg-muted p-2 transition-transform group-hover:translate-x-1 group-hover:bg-primary/10 group-hover:text-primary">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-primary/5 blur-xl" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


