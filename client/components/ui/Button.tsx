import clsx from "clsx";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const styles: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark shadow-card",
  secondary: "bg-white text-ink border border-line hover:bg-cream",
  ghost: "text-ink-muted hover:bg-black/5 hover:text-ink",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function Button({ variant = "primary", loading, disabled, className, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        styles[variant],
        className
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
