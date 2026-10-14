"use client";

import clsx from "clsx";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/format";
import type { CartLine, OrderType, Quote } from "@/lib/types";

interface Props {
  lines: CartLine[];
  quote: Quote | null;
  quoting: boolean;
  quoteError: string;
  type: OrderType;
  tableNumber: string;
  customerName: string;
  tableError: string;
  onType: (t: OrderType) => void;
  onTable: (v: string) => void;
  onCustomer: (v: string) => void;
  onQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCheckout: () => void;
}

const field =
  "h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export function CartPanel(p: Props) {
  const empty = p.lines.length === 0;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Current order</h2>
          {!empty && (
            <button onClick={p.onClear} className="text-sm text-ink-muted underline-offset-2 hover:text-red-600 hover:underline">
              Clear all
            </button>
          )}
        </div>

        <div role="radiogroup" aria-label="Order type" className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-cream p-1">
          {(["dine-in", "takeaway"] as const).map((t) => (
            <button
              key={t}
              role="radio"
              aria-checked={p.type === t}
              onClick={() => p.onType(t)}
              className={clsx(
                "rounded-lg py-2 text-sm font-medium capitalize transition",
                p.type === t ? "bg-white shadow-card" : "text-ink-muted hover:text-ink"
              )}
            >
              {t === "dine-in" ? "Dine-in" : "Takeaway"}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {p.type === "dine-in" && (
            <div>
              <label htmlFor="table" className="sr-only">Table number</label>
              <input
                id="table"
                className={clsx(field, p.tableError && "border-red-400")}
                placeholder="Table no."
                maxLength={10}
                value={p.tableNumber}
                onChange={(e) => p.onTable(e.target.value)}
                aria-invalid={!!p.tableError}
                aria-describedby={p.tableError ? "table-err" : undefined}
              />
            </div>
          )}
          <div className={p.type === "takeaway" ? "col-span-2" : ""}>
            <label htmlFor="customer" className="sr-only">Customer name (optional)</label>
            <input id="customer" className={field} placeholder="Customer (optional)" maxLength={60} value={p.customerName} onChange={(e) => p.onCustomer(e.target.value)} />
          </div>
        </div>
        {p.tableError && <p id="table-err" role="alert" className="mt-1.5 text-xs text-red-600">{p.tableError}</p>}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {empty ? (
          <EmptyState title="Cart is empty" hint="Tap a dish to add it to this order." />
        ) : (
          <ul className="space-y-3">
            {p.lines.map((l) => (
              <li key={l.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.name}</p>
                  <p className="text-xs text-ink-muted">{formatCurrency(l.price)} each</p>
                </div>
                <div className="flex items-center rounded-lg border border-line">
                  <button onClick={() => p.onQty(l.id, -1)} aria-label={`Decrease ${l.name}`} className="grid h-8 w-8 place-items-center rounded-l-lg hover:bg-cream">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm font-medium" aria-live="polite">{l.quantity}</span>
                  <button onClick={() => p.onQty(l.id, 1)} aria-label={`Increase ${l.name}`} className="grid h-8 w-8 place-items-center rounded-r-lg hover:bg-cream">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button onClick={() => p.onRemove(l.id)} aria-label={`Remove ${l.name}`} className="rounded-md p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-line p-4">
        {p.quoteError ? (
          <p role="alert" className="mb-3 text-sm text-red-600">{p.quoteError}</p>
        ) : (
          <dl className={clsx("space-y-1.5 text-sm transition-opacity", p.quoting && "opacity-60")}>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd>{p.quote && !empty ? formatCurrency(p.quote.subtotal) : "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Tax {p.quote ? `(${Math.round(p.quote.taxRate * 100)}%)` : ""}</dt>
              <dd>{p.quote && !empty ? formatCurrency(p.quote.tax) : "—"}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{empty ? "—" : p.quote ? formatCurrency(p.quote.total) : <Skeleton className="h-5 w-16" />}</dd>
            </div>
          </dl>
        )}
        <Button className="mt-4 h-11 w-full" disabled={empty || !p.quote || !!p.quoteError} onClick={p.onCheckout}>
          <ShoppingBag className="h-4 w-4" aria-hidden />
          Place order
        </Button>
      </div>
    </div>
  );
}
