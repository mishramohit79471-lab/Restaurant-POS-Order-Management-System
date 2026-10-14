"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { Pencil, Plus, Power } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { UserFormDialog, type UserFormValues } from "@/components/users/UserFormDialog";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { ManagedUser } from "@/lib/types";

export default function UsersPage() {
  const toast = useToast();
  const { user: me } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [target, setTarget] = useState<ManagedUser | null>(null);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsers((await api<{ users: ManagedUser[] }>("/users")).users);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (me?.role === "admin") load();
    else setLoading(false);
  }, [load, me?.role]);

  const replace = (u: ManagedUser) => setUsers((us) => us.map((x) => (x.id === u.id ? u : x)));

  function openForm(u: ManagedUser | null) {
    setEditing(u);
    setFormError("");
    setFormOpen(true);
  }

  async function save(v: UserFormValues) {
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        const body: Record<string, unknown> = { name: v.name, password: v.password };
        if (editing.id !== me?.id) body.role = v.role;
        const r = await api<{ user: ManagedUser }>(`/users/${editing.id}`, { method: "PATCH", body: JSON.stringify(body) });
        replace(r.user);
        toast.success(`${r.user.name} updated`);
      } else {
        const r = await api<{ user: ManagedUser }>("/users", { method: "POST", body: JSON.stringify(v) });
        setUsers((us) => [...us, r.user]);
        toast.success(`${r.user.name} added as ${r.user.role}`);
      }
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not save user");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    if (!target) return;
    setToggling(true);
    try {
      const r = await api<{ user: ManagedUser }>(`/users/${target.id}`, { method: "PATCH", body: JSON.stringify({ active: !target.active }) });
      replace(r.user);
      toast.success(`${r.user.name} ${r.user.active ? "reactivated" : "deactivated"}`);
      setTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update user");
    } finally {
      setToggling(false);
    }
  }

  return (
    <AppShell title="Users & Roles" roles={["admin"]}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">Admins have full access. Staff can use the POS, orders and billing, and mark dishes sold out.</p>
        <Button onClick={() => openForm(null)} className="shrink-0"><Plus className="h-4 w-4" aria-hidden /> Add user</Button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <Card className="overflow-x-auto">
          {loading ? (
            <div className="space-y-2 p-5">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : users.length === 0 ? (
            <EmptyState title="No users yet" />
          ) : (
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-3 py-3 font-medium">Role</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((u) => {
                  const self = u.id === me?.id;
                  return (
                    <tr key={u.id} className={clsx(!u.active && "text-ink-muted")}>
                      <td className="px-5 py-3">
                        <p className="font-medium">{u.name} {self && <span className="ml-1 rounded bg-cream px-1.5 py-0.5 text-xs font-normal text-ink-muted">You</span>}</p>
                        <p className="text-xs text-ink-muted">{u.email}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", u.role === "admin" ? "bg-charcoal text-white" : "bg-black/5")}>{u.role}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-medium", u.active ? "bg-success-soft text-success" : "bg-black/5")}>{u.active ? "Active" : "Deactivated"}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" className="h-8 px-2.5" onClick={() => openForm(u)} aria-label={`Edit ${u.name}`}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" className="h-8 px-2.5" disabled={self} onClick={() => setTarget(u)} aria-label={`${u.active ? "Deactivate" : "Reactivate"} ${u.name}`} title={self ? "You can’t deactivate your own account" : undefined}>
                            <Power className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      )}

      <UserFormDialog open={formOpen} user={editing} isSelf={editing?.id === me?.id} saving={saving} serverError={formError} onSave={save} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={!!target}
        danger={!!target?.active}
        title={target?.active ? `Deactivate ${target.name}?` : `Reactivate ${target?.name ?? ""}?`}
        description={target?.active ? "They will be signed out immediately and won’t be able to sign in until reactivated." : "They will be able to sign in again."}
        confirmLabel={target?.active ? "Deactivate" : "Reactivate"}
        loading={toggling}
        onCancel={() => setTarget(null)}
        onConfirm={toggleActive}
      />
    </AppShell>
  );
}
