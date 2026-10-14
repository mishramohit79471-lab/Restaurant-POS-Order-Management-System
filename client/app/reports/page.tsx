"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { Download } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { formatCurrency, toDateInput } from "@/lib/format";
import type { SalesReport } from "@/lib/types";

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateInput(d);
};

const PRESETS = [
  { id: "today", label: "Today", range: () => [daysAgo(0), daysAgo(0)] },
  { id: "7d", label: "Last 7 days", range: () => [daysAgo(6), daysAgo(0)] },
  { id: "30d", label: "Last 30 days", range: () => [daysAgo(29), daysAgo(0)] },
  { id: "month", label: "This month", range: () => [toDateInput(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), daysAgo(0)] },
] as const;

const dateInput =
  "h-10 rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function ReportsPage() {
  const toast = useToast();
  const [preset, setPreset] = useState<string>("7d");
  const [from, setFrom] = useState(daysAgo(6));
  const [to, setTo] = useState(daysAgo(0));
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (f: string, t: string) => {
    setLoading(true);
    setError("");
    try {
      setReport(await api<SalesReport>(`/reports/sales?from=${f}&to=${t}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(daysAgo(6), daysAgo(0));
  }, [load]);

  function applyPreset(p: (typeof PRESETS)[number]) {
    const [f, t] = p.range();
    setPreset(p.id);
    setFrom(f);
    setTo(t);
    load(f, t);
  }

  function applyCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!from || !to) return toast.error("Choose both a start and end date");
    if (from > to) return toast.error("The start date must be on or before the end date");
    setPreset("custom");
    load(from, to);
  }

  function exportCsv() {
    if (!report) return;
    const rows = [
      ["Date", "Orders", "Revenue", "Discount", "Tax"],
      ...report.days.map((d) => [d.date, d.orders, d.revenue, d.discount, d.tax]),
      ["Total", report.totals.orders, report.totals.revenue, report.totals.discount, report.totals.tax],
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sales-${report.range.from}_to_${report.range.to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Report exported");
  }

  const t = report?.totals;

  return (
    <AppShell title="Reports" roles={["admin"]}>
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div role="group" aria-label="Quick ranges" className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.id} onClick={() => applyPreset(p)} aria-pressed={preset === p.id}
              className={clsx("rounded-full px-4 py-1.5 text-sm font-medium", preset === p.id ? "bg-charcoal text-white" : "border border-line bg-white text-ink-muted hover:text-ink")}>
              {p.label}
            </button>
          ))}
        </div>
        <form onSubmit={applyCustom} className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="from" className="block text-xs font-medium text-ink-muted">From</label>
            <input id="from" type="date" className={dateInput} value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label htmlFor="to" className="block text-xs font-medium text-ink-muted">To</label>
            <input id="to" type="date" className={dateInput} value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button type="submit" variant="secondary">Apply</Button>
          <Button type="button" onClick={exportCsv} disabled={!report || loading}><Download className="h-4 w-4" aria-hidden /> Export CSV</Button>
        </form>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => load(from, to)} />
      ) : (
        <div className="space-y-6">
          <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Revenue", t && formatCurrency(t.revenue), t && `${t.orders} paid orders`],
              ["Average order", t && formatCurrency(t.averageOrderValue), t && `Tax collected ${formatCurrency(t.tax)}`],
              ["Cash / UPI", t && `${formatCurrency(t.cash.revenue)} / ${formatCurrency(t.upi.revenue)}`, t && `${t.cash.orders} cash · ${t.upi.orders} UPI`],
              ["Awaiting payment", t && formatCurrency(t.unpaid.amount), t && `${t.unpaid.orders} unpaid orders · Discounts ${formatCurrency(t.discount)}`],
            ].map(([label, value, sub]) => (
              <Card key={label as string} className="p-5">
                <p className="text-sm text-ink-muted">{label}</p>
                {loading || !value ? <Skeleton className="mt-2 h-7 w-28" /> : <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>}
                {!loading && <p className="mt-1 text-xs text-ink-muted">{sub}</p>}
              </Card>
            ))}
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Daily revenue" subtitle={report ? `${report.range.from} to ${report.range.to}` : undefined} />
              {loading || !report ? <Skeleton className="m-5 h-56" /> : <SalesChart data={report.days} />}
            </Card>
            <Card>
              <CardHeader title="Top dishes" subtitle="By quantity sold" />
              <div className="p-5 pt-3">
                {loading || !report ? (
                  <div className="space-y-3">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-9" />)}</div>
                ) : report.topItems.length === 0 ? (
                  <EmptyState title="No sales in this range" />
                ) : (
                  <ol className="space-y-3">
                    {report.topItems.map((d, i) => (
                      <li key={d.name} className="flex items-center gap-3 text-sm">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cream text-xs font-semibold">{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate font-medium">{d.name}</span>
                        <span className="text-ink-muted">{d.quantity} sold</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Daily sales summary" />
            <div className="overflow-x-auto p-5 pt-3">
              {loading || !report ? (
                <div className="space-y-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-10" />)}</div>
              ) : report.totals.orders === 0 ? (
                <EmptyState title="No paid orders in this range" hint="Try a wider date range." />
              ) : (
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-ink-muted">
                    <tr>
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 text-right font-medium">Orders</th>
                      <th className="pb-2 text-right font-medium">Discounts</th>
                      <th className="pb-2 text-right font-medium">Tax</th>
                      <th className="pb-2 text-right font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {report.days.map((d) => (
                      <tr key={d.date} className={d.orders === 0 ? "text-ink-muted" : ""}>
                        <td className="py-2.5">{new Date(`${d.date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</td>
                        <td className="py-2.5 text-right">{d.orders}</td>
                        <td className="py-2.5 text-right">{formatCurrency(d.discount)}</td>
                        <td className="py-2.5 text-right">{formatCurrency(d.tax)}</td>
                        <td className="py-2.5 text-right font-medium">{formatCurrency(d.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-line font-semibold">
                    <tr>
                      <td className="pt-3">Total</td>
                      <td className="pt-3 text-right">{report.totals.orders}</td>
                      <td className="pt-3 text-right">{formatCurrency(report.totals.discount)}</td>
                      <td className="pt-3 text-right">{formatCurrency(report.totals.tax)}</td>
                      <td className="pt-3 text-right">{formatCurrency(report.totals.revenue)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
