"use client";

import { useCallback, useEffect, useState } from "react";
import { IndianRupee, Receipt, ShoppingBag, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { api } from "@/lib/api";
import { formatCurrency, timeAgo } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api<DashboardData>("/dashboard"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell title="Dashboard">
      <div className="mb-4 flex justify-end">
        <Button variant="secondary" onClick={load} loading={loading}>
          {!loading && <RefreshCw className="h-4 w-4" aria-hidden />}
          Refresh
        </Button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <div className="space-y-6">
          <section aria-label="Today's summary" className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Today's revenue" icon={IndianRupee} loading={loading} value={data && formatCurrency(data.today.revenue)} />
            <StatCard label="Orders today" icon={ShoppingBag} loading={loading} value={data && String(data.today.orders)} />
            <StatCard label="Average order value" icon={Receipt} loading={loading} value={data && formatCurrency(data.today.averageOrderValue)} />
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Sales overview" subtitle="Revenue over the last 7 days" />
              {loading || !data ? <Skeleton className="m-5 h-56" /> : <SalesChart data={data.sales} />}
            </Card>

            <Card>
              <CardHeader title="Popular dishes" subtitle="Most ordered this week" />
              <div className="p-5 pt-3">
                {loading || !data ? (
                  <div className="space-y-3">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-10" />)}</div>
                ) : data.popularDishes.length === 0 ? (
                  <EmptyState title="No sales yet" hint="Popular dishes appear once orders come in." />
                ) : (
                  <ol className="space-y-3">
                    {data.popularDishes.map((d, i) => (
                      <li key={d.name} className="flex items-center gap-3">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-cream text-xs font-semibold">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{d.name}</p>
                          <p className="text-xs text-ink-muted">{d.quantity} sold</p>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(d.revenue)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Recent orders" />
            <div className="overflow-x-auto p-5 pt-3">
              {loading || !data ? (
                <div className="space-y-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-11" />)}</div>
              ) : data.recentOrders.length === 0 ? (
                <EmptyState title="No orders yet" hint="New orders from the POS terminal will show up here." />
              ) : (
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-ink-muted">
                    <tr>
                      <th className="pb-2 font-medium">Order</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Items</th>
                      <th className="pb-2 font-medium">Total</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 text-right font-medium">Placed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.recentOrders.map((o) => (
                      <tr key={o.id}>
                        <td className="py-3 font-medium">#{o.orderNumber}</td>
                        <td className="py-3 capitalize">{o.type === "dine-in" ? `Dine-in · ${o.tableNumber ?? "—"}` : "Takeaway"}</td>
                        <td className="py-3">{o.itemCount}</td>
                        <td className="py-3 font-medium">{formatCurrency(o.total)}</td>
                        <td className="py-3"><StatusBadge status={o.status} /></td>
                        <td className="py-3 text-right text-ink-muted">{timeAgo(o.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
