import clsx from "clsx";

export function Card({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={clsx("rounded-2xl border border-line bg-white shadow-card", className)} />;
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
