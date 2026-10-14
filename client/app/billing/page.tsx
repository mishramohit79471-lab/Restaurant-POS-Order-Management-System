"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { ArrowLeft, Printer, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PaymentPanel, type PaymentRequest } from "@/components/billing/PaymentPanel";
import { ReceiptDialog } from "@/components/billing/ReceiptDialog";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { formatCurrency, timeAgo } from "@/lib/format";
import type { Bill, ReceiptData } from "@/lib/types";

type Tab = "unpaid" | "paid";

export default function BillingPage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("unpaid");
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [pending, setPending] = useState<{ req: PaymentRequest; total: number } | null>(null);
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setBills((await api<{ orders: Bill[] }>(`/billing?status=${tab}`)).orders);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bills");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    setSelectedId(null);
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase().replace("#", "");
    return bills.filter((b) => !q || String(b.orderNumber).includes(q) || b.tableNumber?.toLowerCase() === q || b.customerName?.toLowerCase().includes(q));
  }, [bills, search]);

  const selected = bills.find((b) => b.id === selectedId) ?? null;

  async function collect() {
    if (!selected || !pending) return;
    setPaying(true);
    try {
      const r = await api<ReceiptData>(`/billing/${selected.id}/pay`, { method: "POST", body: JSON.stringify(pending.req) });
      toast.success(`Order #${r.order.orderNumber} paid — ${formatCurrency(r.order.total)}`);
      setReceipt(r);
      setBills((bs) => bs.filter((b) => b.id !== selected.id));
      setSelectedId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
      load();
    } finally {
      setPaying(false);
      setPending(null);
    }
  }

  async function viewReceipt(b: Bill) {
    try {
      setReceipt(await api<ReceiptData>(`/billing/${b.id}`));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load receipt");
    }
  }

  return (
    <AppShell title="Billing & Payments">
      <div className="lg:grid lg:grid-cols-[22rem_1fr] lg:gap-6">
        <section aria-label="Orders" className={clsx(selected && "hidden lg:block")}>
          <div role="tablist" aria-label="Payment status" className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-black/5 p-1">
            {(["unpaid", "paid"] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                className={clsx("rounded-lg py-2 text-sm font-medium capitalize", tab === t ? "bg-white shadow-card" : "text-ink-muted")}>
                {t === "unpaid" ? "Awaiting payment" : "Paid"}
              </button>
            ))}
          </div>
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
            <label htmlFor="bill-search" className="sr-only">Search by order number, table or customer</label>
            <input id="bill-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order #, table or name…"
              className="h-10 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
          </div>

          {error ? (
            <ErrorState message={error} onRetry={load} />
          ) : loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : visible.length === 0 ? (
            <Card><EmptyState title={tab === "unpaid" ? "No bills waiting" : "No paid orders yet"} hint={search ? "Try a different search." : tab === "unpaid" ? "New orders from the POS show up here." : undefined} /></Card>
          ) : (
            <ul className="space-y-2">
              {visible.map((b) => (
                <li key={b.id}>
                  <button
                    onClick={() => (tab === "paid" ? viewReceipt(b) : setSelectedId(b.id))}
                    aria-pressed={b.id === selectedId}
                    className={clsx("flex w-full items-center justify-between gap-3 rounded-xl border bg-white p-3 text-left shadow-card transition hover:border-brand/60", b.id === selectedId ? "border-brand ring-1 ring-brand" : "border-line")}
                  >
                    <div>
                      <p className="font-semibold">#{b.orderNumber}</p>
                      <p className="text-xs text-ink-muted">
                        {b.type === "dine-in" ? `Table ${b.tableNumber}` : "Takeaway"} · {timeAgo(b.paidAt ?? b.createdAt)}
                        {tab === "paid" && b.paymentMethod ? ` · ${b.paymentMethod.toUpperCase()}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-medium">{formatCurrency(b.total)}</span>
                      {tab === "paid" ? <Printer className="h-4 w-4 text-ink-muted" aria-label="View receipt" /> : <StatusBadge status={b.status} />}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Payment" className={clsx(!selected && "hidden lg:block")}>
          {selected ? (
            <Card className="p-5">
              <button onClick={() => setSelectedId(null)} className="mb-3 flex items-center gap-1 text-sm text-ink-muted hover:text-ink lg:hidden">
                <ArrowLeft className="h-4 w-4" aria-hidden /> All bills
              </button>
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Order #{selected.orderNumber}</h2>
                  <p className="text-sm text-ink-muted">
                    {selected.type === "dine-in" ? `Dine-in · Table ${selected.tableNumber}` : "Takeaway"}
                    {selected.customerName ? ` · ${selected.customerName}` : ""}
                  </p>
                </div>
                <StatusBadge status={selected.status} />
              </div>
              <PaymentPanel key={selected.id} bill={selected} paying={paying} onPay={(req, total) => setPending({ req, total })} />
            </Card>
          ) : (
            <Card className="hidden lg:block">
              <EmptyState title="Select an order to bill" hint="Pick an order from the list to apply a discount and take payment." />
            </Card>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={!!pending}
        title="Collect payment?"
        description={`Record ${pending?.req.method === "upi" ? "a UPI" : "a cash"} payment of ₹${pending?.total.toFixed(2)} for order #${selected?.orderNumber ?? ""}. This can't be undone.`}
        confirmLabel="Confirm payment"
        loading={paying}
        onCancel={() => setPending(null)}
        onConfirm={collect}
      />
      <ReceiptDialog data={receipt} onClose={() => setReceipt(null)} />
    </AppShell>
  );
}
