import clsx from "clsx";
import type { OrderStatus } from "@/lib/types";

const styles: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  preparing: "bg-brand-soft text-brand-dark ring-orange-200",
  ready: "bg-blue-50 text-blue-700 ring-blue-200",
  completed: "bg-success-soft text-success ring-green-200",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={clsx("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset", styles[status])}>
      {status}
    </span>
  );
}
