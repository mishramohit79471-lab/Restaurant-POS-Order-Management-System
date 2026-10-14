"use client";

import { useEffect, useRef } from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ReceiptData } from "@/lib/types";

const money = (n: number) => `₹${n.toFixed(2)}`;

export function ReceiptDialog({ data, onClose }: { data: ReceiptData | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!data) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, onClose]);

  if (!data) return null;
  const { order: o, restaurantName, address } = data;
  const paidAt = o.paidAt ? new Date(o.paidAt) : new Date(o.createdAt);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={`Receipt for order ${o.orderNumber}`}>
      <div className="my-auto w-full max-w-sm">
        <div id="receipt" className="rounded-2xl bg-white p-6 font-mono text-[13px] leading-relaxed text-black shadow-xl">
          <div className="text-center">
            <p className="text-base font-bold">{restaurantName}</p>
            {address && <p>{address}</p>}
            <p className="mt-1">Receipt #{o.orderNumber}</p>
            <p>{paidAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
            <p>{o.type === "dine-in" ? `Dine-in · Table ${o.tableNumber}` : "Takeaway"}{o.customerName ? ` · ${o.customerName}` : ""}</p>
          </div>

          <hr className="my-3 border-dashed border-black/40" />
          <table className="w-full">
            <tbody>
              {o.items.map((i) => (
                <tr key={i.name} className="align-top">
                  <td className="pr-2">{i.quantity} × {i.name}</td>
                  <td className="text-right">{money(i.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr className="my-3 border-dashed border-black/40" />

          <dl className="space-y-0.5">
            <Row label="Subtotal" value={money(o.subtotal)} />
            {o.discount > 0 && <Row label="Discount" value={`-${money(o.discount)}`} />}
            <Row label={`Tax (${Math.round(o.taxRate * 100)}%)`} value={money(o.tax)} />
            <div className="flex justify-between border-t border-black/40 pt-1 text-base font-bold">
              <dt>TOTAL</dt>
              <dd>{money(o.total)}</dd>
            </div>
          </dl>

          <hr className="my-3 border-dashed border-black/40" />
          <dl className="space-y-0.5">
            <Row label="Paid by" value={o.paymentMethod === "upi" ? "UPI" : "Cash"} />
            {o.paymentMethod === "cash" && o.amountTendered !== undefined && (
              <>
                <Row label="Cash received" value={money(o.amountTendered)} />
                <Row label="Change" value={money(o.changeGiven ?? 0)} />
              </>
            )}
            {o.paymentMethod === "upi" && o.upiReference && <Row label="UPI ref" value={o.upiReference} />}
          </dl>
          <p className="mt-4 text-center">Thank you! Visit again.</p>
        </div>

        <div className="mt-3 flex justify-center gap-2">
          <Button onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden /> Print receipt</Button>
          <button ref={closeRef} onClick={onClose} className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-medium shadow-card hover:bg-cream">
            <X className="h-4 w-4" aria-hidden /> Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
