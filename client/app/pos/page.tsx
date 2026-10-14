"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Search, ShoppingCart, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MenuCard } from "@/components/pos/MenuCard";
import { CartPanel } from "@/components/pos/CartPanel";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { CartLine, MenuItem, OrderType, Quote } from "@/lib/types";

export default function PosPage() {
  const toast = useToast();

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const [lines, setLines] = useState<CartLine[]>([]);
  const [type, setType] = useState<OrderType>("dine-in");
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [tableError, setTableError] = useState("");

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  const [confirming, setConfirming] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setMenu((await api<{ items: MenuItem[] }>("/menu")).items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load menu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Totals always come from the server (debounced); the client never calculates money.
  useEffect(() => {
    if (lines.length === 0) {
      setQuote(null);
      setQuoteError("");
      return;
    }
    let stale = false;
    setQuoting(true);
    const t = setTimeout(async () => {
      try {
        const q = await api<Quote>("/orders/quote", {
          method: "POST",
          body: JSON.stringify({ items: lines.map((l) => ({ menuItemId: l.id, quantity: l.quantity })) }),
        });
        if (!stale) {
          setQuote(q);
          setQuoteError("");
        }
      } catch (e) {
        if (!stale) setQuoteError(e instanceof Error ? e.message : "Could not calculate totals");
      } finally {
        if (!stale) setQuoting(false);
      }
    }, 250);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [lines]);

  const categories = useMemo(() => ["All", ...new Set(menu.map((m) => m.category))], [menu]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menu.filter((m) => (category === "All" || m.category === category) && (!q || m.name.toLowerCase().includes(q)));
  }, [menu, category, search]);

  const qtyById = useMemo(() => new Map(lines.map((l) => [l.id, l.quantity])), [lines]);
  const itemCount = lines.reduce((n, l) => n + l.quantity, 0);

  const add = (item: MenuItem) =>
    setLines((ls) =>
      ls.some((l) => l.id === item.id)
        ? ls.map((l) => (l.id === item.id ? { ...l, quantity: Math.min(l.quantity + 1, 50) } : l))
        : [...ls, { id: item.id, name: item.name, price: item.price, quantity: 1 }]
    );
  const changeQty = (id: string, d: number) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, quantity: Math.min(50, l.quantity + d) } : l)).filter((l) => l.quantity > 0));
  const remove = (id: string) => setLines((ls) => ls.filter((l) => l.id !== id));

  function startCheckout() {
    if (type === "dine-in" && !tableNumber.trim()) {
      setTableError("Enter a table number for dine-in orders");
      setCartOpen(true);
      return;
    }
    setTableError("");
    setConfirming(true);
  }

  async function placeOrder() {
    setPlacing(true);
    try {
      const r = await api<{ order: { orderNumber: number; total: number } }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          type,
          tableNumber: type === "dine-in" ? tableNumber.trim() : undefined,
          customerName: customerName.trim() || undefined,
          items: lines.map((l) => ({ menuItemId: l.id, quantity: l.quantity })),
        }),
      });
      toast.success(`Order #${r.order.orderNumber} placed — ${formatCurrency(r.order.total)}`);
      setLines([]);
      setTableNumber("");
      setCustomerName("");
      setCartOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not place order");
      loadMenu(); // an item may have just sold out
    } finally {
      setPlacing(false);
      setConfirming(false);
    }
  }

  const cart = (
    <CartPanel
      lines={lines}
      quote={quote}
      quoting={quoting}
      quoteError={quoteError}
      type={type}
      tableNumber={tableNumber}
      customerName={customerName}
      tableError={tableError}
      onType={(t) => { setType(t); setTableError(""); }}
      onTable={(v) => { setTableNumber(v); setTableError(""); }}
      onCustomer={setCustomerName}
      onQty={changeQty}
      onRemove={remove}
      onClear={() => setLines([])}
      onCheckout={startCheckout}
    />
  );

  return (
    <AppShell title="POS Terminal">
      <div className="lg:grid lg:grid-cols-[1fr_22rem] lg:gap-6">
        <section aria-label="Menu">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
            <label htmlFor="search" className="sr-only">Search dishes</label>
            <input
              id="search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes…"
              className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div role="tablist" aria-label="Categories" className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-2">
            {categories.map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={category === c}
                onClick={() => setCategory(c)}
                className={clsx(
                  "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition",
                  category === c ? "bg-charcoal text-white" : "border border-line bg-white text-ink-muted hover:text-ink"
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-4 pb-24 lg:pb-0">
            {error ? (
              <ErrorState message={error} onRetry={loadMenu} />
            ) : loading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
              </div>
            ) : visible.length === 0 ? (
              <Card><EmptyState title="No dishes found" hint={search ? `Nothing matches “${search}”.` : "This category has no items yet."} /></Card>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {visible.map((m) => (
                  <MenuCard key={m.id} item={m} inCart={qtyById.get(m.id) ?? 0} onAdd={add} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Desktop cart */}
        <aside aria-label="Cart" className="hidden lg:block">
          <Card className="sticky top-24 h-[calc(100vh-8rem)] overflow-hidden">{cart}</Card>
        </aside>
      </div>

      {/* Mobile cart */}
      <button
        onClick={() => setCartOpen(true)}
        className="fixed inset-x-4 bottom-4 z-20 flex h-12 items-center justify-between rounded-xl bg-brand px-4 font-medium text-white shadow-lg lg:hidden"
      >
        <span className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" aria-hidden /> View cart ({itemCount})</span>
        <span>{quote ? formatCurrency(quote.total) : ""}</span>
      </button>
      {cartOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Cart">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} aria-hidden />
          <div className="absolute inset-x-0 bottom-0 h-[85vh] animate-fade-in overflow-hidden rounded-t-2xl bg-white">
            <button onClick={() => setCartOpen(false)} aria-label="Close cart" className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-ink-muted hover:bg-black/5">
              <X className="h-5 w-5" />
            </button>
            {cart}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        title="Place this order?"
        description={`${itemCount} item${itemCount === 1 ? "" : "s"} · ${type === "dine-in" ? `Table ${tableNumber.trim()}` : "Takeaway"} · ${quote ? formatCurrency(quote.total) : ""}. It will be sent to the kitchen.`}
        confirmLabel="Place order"
        loading={placing}
        onCancel={() => setConfirming(false)}
        onConfirm={placeOrder}
      />
    </AppShell>
  );
}
