"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { OrderCard } from "@/components/orders/OrderCard";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { api, ApiError } from "@/lib/api";
import type { BoardOrder, OrderStatus } from "@/lib/types";

const COLUMNS: { status: OrderStatus; title: string; dot: string; empty: string }[] = [
  { status: "pending", title: "Pending", dot: "bg-amber-500", empty: "No new orders" },
  { status: "preparing", title: "Preparing", dot: "bg-brand", empty: "Nothing on the stove" },
  { status: "ready", title: "Ready", dot: "bg-blue-500", empty: "No orders waiting to be served" },
  { status: "completed", title: "Completed", dot: "bg-success", empty: "No completed orders today" },
];
const POLL_MS = 15000;

export default function OrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<BoardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [completing, setCompleting] = useState<BoardOrder | null>(null);
  const [mobileTab, setMobileTab] = useState<OrderStatus>("pending");

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await api<{ orders: BoardOrder[] }>("/orders");
      setOrders(r.orders);
      setError("");
    } catch (e) {
      // A failed background poll shouldn't wipe a board the user is looking at.
      if (!silent) setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => !document.hidden && load(true), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const grouped = useMemo(() => {
    const g: Record<OrderStatus, BoardOrder[]> = { pending: [], preparing: [], ready: [], completed: [] };
    orders.forEach((o) => g[o.status].push(o));
    g.completed.reverse(); // newest completed first
    return g;
  }, [orders]);

  async function advance(order: BoardOrder) {
    setBusyId(order.id);
    try {
      const r = await api<{ order: BoardOrder }>(`/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ from: order.status }),
      });
      setOrders((os) => os.map((o) => (o.id === order.id ? r.order : o)));
      toast.success(`Order #${order.orderNumber} is now ${r.order.status}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update order");
      if (e instanceof ApiError && e.status === 409) load(true);
    } finally {
      setBusyId(null);
      setCompleting(null);
    }
  }

  const onAdvance = (o: BoardOrder) => (o.status === "ready" ? setCompleting(o) : advance(o));

  return (
    <AppShell title="Live Orders">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">Updates automatically every 15 seconds.</p>
        <Button variant="secondary" onClick={() => load()} loading={loading}>
          {!loading && <RefreshCw className="h-4 w-4" aria-hidden />}
          Refresh
        </Button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => load()} />
      ) : (
        <>
          {/* Phone/tablet: one column at a time */}
          <div role="tablist" aria-label="Order status" className="mb-4 flex gap-2 overflow-x-auto xl:hidden">
            {COLUMNS.map((c) => (
              <button
                key={c.status}
                role="tab"
                aria-selected={mobileTab === c.status}
                onClick={() => setMobileTab(c.status)}
                className={clsx(
                  "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium",
                  mobileTab === c.status ? "bg-charcoal text-white" : "border border-line bg-white text-ink-muted"
                )}
              >
                {c.title} ({grouped[c.status].length})
              </button>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            {COLUMNS.map((c) => (
              <section key={c.status} aria-label={`${c.title} orders`} className={clsx(mobileTab !== c.status && "hidden xl:block")}>
                <h2 className="mb-3 hidden items-center gap-2 text-sm font-semibold xl:flex">
                  <span className={clsx("h-2.5 w-2.5 rounded-full", c.dot)} aria-hidden />
                  {c.title}
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium text-ink-muted">{grouped[c.status].length}</span>
                </h2>
                <div className="rounded-2xl bg-black/[0.03] p-2.5">
                  {loading ? (
                    <div className="space-y-2.5">{[0, 1].map((i) => <Skeleton key={i} className="h-36" />)}</div>
                  ) : grouped[c.status].length === 0 ? (
                    <EmptyState title={c.empty} />
                  ) : (
                    <ul className="space-y-2.5">
                      {grouped[c.status].map((o) => (
                        <OrderCard key={o.id} order={o} busy={busyId === o.id} onAdvance={onAdvance} />
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!completing}
        title={`Complete order #${completing?.orderNumber ?? ""}?`}
        description="Confirm that this order has been served. It will move to Completed."
        confirmLabel="Complete order"
        loading={!!completing && busyId === completing.id}
        onCancel={() => setCompleting(null)}
        onConfirm={() => completing && advance(completing)}
      />
    </AppShell>
  );
}
