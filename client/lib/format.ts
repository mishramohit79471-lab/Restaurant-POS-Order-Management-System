const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatCurrency = (n: number) => inr.format(n);

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

export const formatShortDay = (yyyyMmDd: string) =>
  new Date(`${yyyyMmDd}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short" });

export function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

export const formatDayLabel = (yyyyMmDd: string, weekday: boolean) =>
  new Date(`${yyyyMmDd}T00:00:00`).toLocaleDateString("en-IN", weekday ? { weekday: "short" } : { day: "numeric", month: "short" });

export const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
