import clsx from "clsx";
import { Clock, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency, timeAgo } from "@/lib/format";
import type { BoardOrder, OrderStatus } from "@/lib/types";

export const NEXT_ACTION: Partial<Record<OrderStatus, string>> = {
  pending: "Start preparing",
  preparing: "Mark ready",
  ready: "Complete order",
};

interface Props {
  order: BoardOrder;
  busy: boolean;
  onAdvance: (order: BoardOrder) => void;
}

export function OrderCard({ order, busy, onAdvance }: Props) {
  const waitingMins = Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000);
  const late = order.status !== "completed" && waitingMins >= 20;
  const action = NEXT_ACTION[order.status];

  return (
    <li className="rounded-xl border border-line bg-white p-3.5 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">#{order.orderNumber}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
            {order.type === "dine-in" ? (
              <><UtensilsCrossed className="h-3.5 w-3.5" aria-hidden /> Table {order.tableNumber}</>
            ) : (
              <><ShoppingBag className="h-3.5 w-3.5" aria-hidden /> Takeaway</>
            )}
            {order.customerName && <span>· {order.customerName}</span>}
          </p>
        </div>
        <span className={clsx("flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", late ? "bg-red-50 text-red-700" : "bg-cream text-ink-muted")}>
          <Clock className="h-3 w-3" aria-hidden />
          {timeAgo(order.createdAt)}
          {late && <span className="sr-only"> (running late)</span>}
        </span>
      </div>

      <ul className="mt-3 space-y-1 border-t border-dashed border-line pt-3 text-sm">
        {order.items.map((i) => (
          <li key={i.name} className="flex gap-2">
            <span className="w-6 shrink-0 font-medium text-brand">{i.quantity}×</span>
            <span>{i.name}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-medium">{formatCurrency(order.total)}</span>
        {action && (
          <Button className="h-9 px-3 text-xs" loading={busy} onClick={() => onAdvance(order)} aria-label={`${action} for order ${order.orderNumber}`}>
            {action}
          </Button>
        )}
      </div>
    </li>
  );
}
