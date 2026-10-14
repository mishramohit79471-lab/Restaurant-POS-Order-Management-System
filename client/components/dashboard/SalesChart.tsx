import { formatCurrency, formatDayLabel } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

export function SalesChart({ data }: { data: DashboardData["sales"] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const lastIndex = data.length - 1;

  return (
    <div>
      <div className="flex h-56 items-end gap-[3px] sm:gap-1.5 px-5 pb-2 pt-6" role="img" aria-label="Revenue by day, shown as a bar chart">
        {data.map((d, i) => (
          <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end">
            <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-charcoal px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              {formatCurrency(d.revenue)} · {d.orders} orders
            </div>
            <div
              className={i === lastIndex ? "rounded-t-md bg-brand" : "rounded-t-md bg-brand/35 transition-colors group-hover:bg-brand/60"}
              style={{ height: `${Math.max((d.revenue / max) * 100, d.revenue ? 3 : 0)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-[3px] border-t sm:gap-1.5 border-line px-5 py-2 text-xs text-ink-muted" aria-hidden>
        {data.map((d, i) => (
          <span key={d.date} className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-center">
            {data.length <= 7 || i % Math.ceil(data.length / 7) === 0 ? formatDayLabel(d.date, data.length <= 7) : ""}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Daily revenue</caption>
        <thead><tr><th>Date</th><th>Revenue</th><th>Orders</th></tr></thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}><td>{d.date}</td><td>{formatCurrency(d.revenue)}</td><td>{d.orders}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
