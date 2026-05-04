import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Users, X, ArrowRight } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/groups")({
  head: () => ({ meta: [{ title: "Groups — Stratega" }] }),
  component: GroupsPage,
});

type Group = { id: string; name: string; ownerId: string; members?: { id: string; name: string }[] };

function GroupsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [memberInput, setMemberInput] = useState("");

  const groups = useQuery({
    queryKey: ["groups", user?.id],
    queryFn: () => api<Group[]>(`/api/groups?userId=${user?.id}`),
    enabled: !!user?.id,
  });

  const create = useMutation({
    mutationFn: () =>
      api<Group>("/api/groups", {
        method: "POST",
        body: JSON.stringify({ name, ownerId: user?.id, members }),
      }),
    onSuccess: () => {
      toast.success("Group created");
      setOpen(false); setName(""); setMembers([]); setMemberInput("");
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed"),
  });

  function addMember() {
    const v = memberInput.trim();
    if (v && !members.includes(v)) setMembers([...members, v]);
    setMemberInput("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Groups</h1>
          <p className="text-sm text-muted-foreground">Split shared expenses with friends and settle up smartly.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New group</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create group</DialogTitle></DialogHeader>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Trip to Lisbon" />
              </div>
              <div className="space-y-2">
                <Label>Members</Label>
                <div className="flex gap-2">
                  <Input
                    value={memberInput}
                    onChange={(e) => setMemberInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMember(); } }}
                    placeholder="Add member name and press Enter"
                  />
                  <Button type="button" variant="secondary" onClick={addMember}>Add</Button>
                </div>
                {members.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {members.map((m) => (
                      <Badge key={m} variant="secondary" className="gap-1">
                        {m}
                        <button type="button" onClick={() => setMembers(members.filter((x) => x !== m))}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={create.isPending}>
                {create.isPending ? "Creating…" : "Create group"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {groups.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (groups.data ?? []).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 font-display text-lg">No groups yet</p>
          <p className="text-sm text-muted-foreground">Create a group to start splitting expenses.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.data!.map((g) => (
            <Link
              key={g.id}
              to="/groups/$groupId"
              params={{ groupId: g.id }}
              className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-lg font-semibold">{g.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {g.members?.length ?? 0} member{(g.members?.length ?? 0) === 1 ? "" : "s"}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
