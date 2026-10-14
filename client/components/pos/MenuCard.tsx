import clsx from "clsx";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { MenuItem } from "@/lib/types";

interface Props {
  item: MenuItem;
  inCart: number;
  onAdd: (item: MenuItem) => void;
}

export function MenuCard({ item, inCart, onAdd }: Props) {
  return (
    <button
      type="button"
      disabled={!item.available}
      onClick={() => onAdd(item)}
      aria-label={`Add ${item.name}, ${formatCurrency(item.price)}${item.available ? "" : ", unavailable"}`}
      className={clsx(
        "group relative flex flex-col rounded-2xl border bg-white p-4 text-left shadow-card transition",
        item.available ? "border-line hover:-translate-y-0.5 hover:border-brand/60 hover:shadow-md" : "cursor-not-allowed opacity-55",
        inCart > 0 && "border-brand ring-1 ring-brand"
      )}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">{item.category}</span>
      <span className="mt-1 line-clamp-2 min-h-[2.5rem] font-medium leading-snug">{item.name}</span>
      <span className="mt-3 flex items-center justify-between">
        <span className="font-semibold">{formatCurrency(item.price)}</span>
        {item.available ? (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-brand transition group-hover:bg-brand group-hover:text-white">
            <Plus className="h-4 w-4" aria-hidden />
          </span>
        ) : (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Sold out</span>
        )}
      </span>
      {inCart > 0 && (
        <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-brand px-1.5 text-xs font-semibold text-white">
          {inCart}
        </span>
      )}
    </button>
  );
}
