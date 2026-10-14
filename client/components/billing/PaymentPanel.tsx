"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Banknote, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Bill, BillQuote, DiscountType, PaymentMethod } from "@/lib/types";

export interface PaymentRequest {
  method: PaymentMethod;
  discountType: DiscountType;
  discountValue: number;
  amountTendered?: number;
  upiReference?: string;
}

interface Props {
  bill: Bill;
  paying: boolean;
  onPay: (req: PaymentRequest, total: number) => void;
}

const field =
  "h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export function PaymentPanel({ bill, paying, onPay }: Props) {
  const [discountType, setDiscountType] = useState<DiscountType>("none");
  const [discountText, setDiscountText] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [tenderedText, setTenderedText] = useState("");
  const [upiRef, setUpiRef] = useState("");
  const [quote, setQuote] = useState<BillQuote | null>(null);
  const [quoteError, setQuoteError] = useState("");

  const discountValue = Number(discountText) || 0;
  const tendered = tenderedText.trim() === "" ? undefined : Number(tenderedText);

  // Every figure shown here is computed by the server; this component only collects inputs.
  useEffect(() => {
    let stale = false;
    const t = setTimeout(async () => {
      try {
        const q = await api<BillQuote>(`/billing/${bill.id}/quote`, {
          method: "POST",
          body: JSON.stringify({
            discountType: discountType === "none" ? "none" : discountType,
            discountValue,
            amountTendered: method === "cash" ? tendered : undefined,
          }),
        });
        if (!stale) { setQuote(q); setQuoteError(""); }
      } catch (e) {
        if (!stale) setQuoteError(e instanceof Error ? e.message : "Could not calculate totals");
      }
    }, 250);
    return () => { stale = true; clearTimeout(t); };
  }, [bill.id, discountType, discountValue, method, tendered]);

  const cashShort = method === "cash" && (tendered === undefined || !quote || tendered < quote.total);
  const canPay = !!quote && !quoteError && !cashShort;

  return (
    <div className="space-y-5">
      <ul className="divide-y divide-line rounded-xl border border-line text-sm">
        {bill.items.map((i) => (
          <li key={i.name} className="flex justify-between px-3 py-2">
            <span>{i.quantity} × {i.name}</span>
            <span className="font-medium">{formatCurrency(i.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <fieldset>
        <legend className="text-sm font-medium">Discount</legend>
        <div className="mt-1.5 grid grid-cols-[8rem_1fr] gap-2">
          <select
            aria-label="Discount type"
            className={field}
            value={discountType}
            onChange={(e) => { setDiscountType(e.target.value as DiscountType); setDiscountText(""); }}
          >
            <option value="none">None</option>
            <option value="percent">Percent (%)</option>
            <option value="amount">Amount (₹)</option>
          </select>
          <input
            aria-label="Discount value"
            type="number"
            inputMode="decimal"
            min="0"
            className={field}
            disabled={discountType === "none"}
            placeholder={discountType === "percent" ? "e.g. 10" : discountType === "amount" ? "e.g. 50" : "—"}
            value={discountText}
            onChange={(e) => setDiscountText(e.target.value)}
          />
        </div>
      </fieldset>

      <dl className="space-y-1.5 rounded-xl bg-cream p-3 text-sm">
        <Line label="Subtotal" value={quote ? formatCurrency(quote.subtotal) : "—"} />
        {!!quote?.discount && <Line label="Discount" value={`-${formatCurrency(quote.discount)}`} className="text-success" />}
        <Line label={`Tax${quote ? ` (${Math.round(quote.taxRate * 100)}%)` : ""}`} value={quote ? formatCurrency(quote.tax) : "—"} />
        <div className="flex justify-between border-t border-line pt-2 text-lg font-semibold">
          <dt>Total due</dt>
          <dd>{quote ? `₹${quote.total.toFixed(2)}` : "—"}</dd>
        </div>
      </dl>
      {quoteError && <p role="alert" className="text-sm text-red-600">{quoteError}</p>}

      <div>
        <p id="pay-method" className="text-sm font-medium">Payment method</p>
        <div role="radiogroup" aria-labelledby="pay-method" className="mt-1.5 grid grid-cols-2 gap-2">
          {([["cash", "Cash", Banknote], ["upi", "UPI", Smartphone]] as const).map(([m, label, Icon]) => (
            <button
              key={m}
              role="radio"
              aria-checked={method === m}
              onClick={() => setMethod(m)}
              className={clsx("flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition", method === m ? "border-brand bg-brand-soft text-brand-dark" : "border-line bg-white hover:bg-cream")}
            >
              <Icon className="h-4 w-4" aria-hidden /> {label}
            </button>
          ))}
        </div>

        {method === "cash" ? (
          <div className="mt-3">
            <label htmlFor="tendered" className="text-sm font-medium">Cash received (₹)</label>
            <input id="tendered" type="number" inputMode="decimal" min="0" className={`${field} mt-1.5`} value={tenderedText} onChange={(e) => setTenderedText(e.target.value)} />
            {quote && tendered !== undefined && (
              <p role="status" className={clsx("mt-1.5 text-sm font-medium", (quote.change ?? 0) >= 0 ? "text-success" : "text-red-600")}>
                {(quote.change ?? 0) >= 0 ? `Change to return: ${formatCurrency(quote.change ?? 0)}` : `Short by ${formatCurrency(Math.abs(quote.change ?? 0))}`}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-3">
            <label htmlFor="upiref" className="text-sm font-medium">UPI reference <span className="font-normal text-ink-muted">(optional)</span></label>
            <input id="upiref" maxLength={40} className={`${field} mt-1.5`} placeholder="Transaction ID" value={upiRef} onChange={(e) => setUpiRef(e.target.value)} />
          </div>
        )}
      </div>

      <Button
        className="h-12 w-full text-base"
        disabled={!canPay}
        loading={paying}
        onClick={() =>
          quote &&
          onPay(
            { method, discountType, discountValue, amountTendered: method === "cash" ? tendered : undefined, upiReference: method === "upi" ? upiRef.trim() || undefined : undefined },
            quote.total
          )
        }
      >
        Collect {quote ? `₹${quote.total.toFixed(2)}` : "payment"}
      </Button>
    </div>
  );
}

function Line({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={clsx("flex justify-between", className)}>
      <dt className={className ? "" : "text-ink-muted"}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
