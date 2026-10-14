"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Pencil, Plus, Power, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MenuFormDialog, type MenuFormValues } from "@/components/menu/MenuFormDialog";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import type { MenuItem } from "@/lib/types";

type ManagedItem = MenuItem & { active: boolean };
type Filter = "all" | "available" | "soldout" | "inactive";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "soldout", label: "Sold out" },
  { id: "inactive", label: "Inactive" },
];

export default function MenuPage() {
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [items, setItems] = useState<ManagedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [toggleTarget, setToggleTarget] = useState<ManagedItem | null>(null);
  const [togglingActive, setTogglingActive] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems((await api<{ items: ManagedItem[] }>("/menu/all")).items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load menu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => [...new Set(items.map((i) => i.category))].sort(), [items]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "available" && i.active && i.available) ||
        (filter === "soldout" && i.active && !i.available) ||
        (filter === "inactive" && !i.active);
      return matchesFilter && (!q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    });
  }, [items, search, filter]);

  const replace = (updated: ManagedItem) => setItems((is) => is.map((i) => (i.id === updated.id ? updated : i)));

  async function patch(id: string, body: object) {
    const r = await api<{ item: ManagedItem }>(`/menu/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    replace(r.item);
    return r.item;
  }

  async function toggleAvailable(item: ManagedItem) {
    setBusyId(item.id);
    try {
      const u = await patch(item.id, { available: !item.available });
      toast.success(`${u.name} marked ${u.available ? "available" : "sold out"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update item");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmToggleActive() {
    if (!toggleTarget) return;
    setTogglingActive(true);
    try {
      const u = await patch(toggleTarget.id, { active: !toggleTarget.active });
      toast.success(`${u.name} ${u.active ? "reactivated" : "deactivated"}`);
      setToggleTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update item");
    } finally {
      setTogglingActive(false);
    }
  }

  async function save(values: MenuFormValues) {
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        const u = await patch(editing.id, values);
        toast.success(`${u.name} updated`);
      } else {
        const r = await api<{ item: ManagedItem }>("/menu", { method: "POST", body: JSON.stringify(values) });
        setItems((is) => [...is, r.item].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)));
        toast.success(`${r.item.name} added to the menu`);
      }
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not save item");
    } finally {
      setSaving(false);
    }
  }

  const openForm = (item: ManagedItem | null) => {
    setEditing(item);
    setFormError("");
    setFormOpen(true);
  };

  return (
    <AppShell title="Menu Management">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
          <label htmlFor="menu-search" className="sr-only">Search menu items</label>
          <input id="menu-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or category…" className="h-10 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
        </div>
        {isAdmin && (
          <Button onClick={() => openForm(null)}>
            <Plus className="h-4 w-4" aria-hidden /> Add item
          </Button>
        )}
      </div>

      <div role="tablist" aria-label="Filter by status" className="mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}
            className={clsx("shrink-0 rounded-full px-4 py-1.5 text-sm font-medium", filter === f.id ? "bg-charcoal text-white" : "border border-line bg-white text-ink-muted hover:text-ink")}>
            {f.label}
          </button>
        ))}
      </div>

      {!isAdmin && !error && (
        <p className="mb-4 rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-dark">
          You can mark dishes as available or sold out. Adding, editing and deactivating items is limited to admins.
        </p>
      )}

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <Card className="overflow-x-auto">
          {loading ? (
            <div className="space-y-2 p-5">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : visible.length === 0 ? (
            <EmptyState title="No menu items found" hint={search || filter !== "all" ? "Try a different search or filter." : isAdmin ? "Add your first dish to get started." : "No dishes have been added yet."} />
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Dish</th>
                  <th className="px-3 py-3 font-medium">Category</th>
                  <th className="px-3 py-3 font-medium">Price</th>
                  <th className="px-3 py-3 font-medium">Availability</th>
                  {isAdmin && <th className="px-5 py-3 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((i) => (
                  <tr key={i.id} className={clsx(!i.active && "bg-black/[0.02] text-ink-muted")}>
                    <td className="px-5 py-3">
                      <p className="font-medium">{i.name}</p>
                      {i.description && <p className="max-w-xs truncate text-xs text-ink-muted">{i.description}</p>}
                    </td>
                    <td className="px-3 py-3">{i.category}</td>
                    <td className="px-3 py-3 font-medium">{formatCurrency(i.price)}</td>
                    <td className="px-3 py-3">
                      {i.active ? (
                        <button
                          role="switch"
                          aria-checked={i.available}
                          aria-label={`${i.name} availability`}
                          disabled={busyId === i.id}
                          onClick={() => toggleAvailable(i)}
                          className="flex items-center gap-2 disabled:opacity-60"
                        >
                          <span className={clsx("relative h-5 w-9 rounded-full transition-colors", i.available ? "bg-success" : "bg-black/20")}>
                            <span className={clsx("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", i.available ? "left-[18px]" : "left-0.5")} />
                          </span>
                          <span className={clsx("text-xs font-medium", i.available ? "text-success" : "text-ink-muted")}>{i.available ? "Available" : "Sold out"}</span>
                        </button>
                      ) : (
                        <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-medium">Inactive</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" className="h-8 px-2.5" onClick={() => openForm(i)} aria-label={`Edit ${i.name}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" className={clsx("h-8 px-2.5", i.active ? "hover:text-red-600" : "hover:text-success")} onClick={() => setToggleTarget(i)} aria-label={`${i.active ? "Deactivate" : "Reactivate"} ${i.name}`}>
                            <Power className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      <MenuFormDialog open={formOpen} item={editing} categories={categories} saving={saving} serverError={formError} onSave={save} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={!!toggleTarget}
        danger={!!toggleTarget?.active}
        title={toggleTarget?.active ? `Deactivate ${toggleTarget.name}?` : `Reactivate ${toggleTarget?.name ?? ""}?`}
        description={toggleTarget?.active ? "It will be hidden from the POS terminal. Past orders are not affected, and you can reactivate it any time." : "It will appear on the POS terminal again."}
        confirmLabel={toggleTarget?.active ? "Deactivate" : "Reactivate"}
        loading={togglingActive}
        onCancel={() => setToggleTarget(null)}
        onConfirm={confirmToggleActive}
      />
    </AppShell>
  );
}
