import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  label: string;
  value?: string | null;
  icon: LucideIcon;
  loading?: boolean;
}

export function StatCard({ label, value, icon: Icon, loading }: Props) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-ink-muted">{label}</p>
        {loading ? <Skeleton className="mt-1.5 h-7 w-24" /> : <p className="truncate text-2xl font-semibold tracking-tight">{value}</p>}
      </div>
    </Card>
  );
}
