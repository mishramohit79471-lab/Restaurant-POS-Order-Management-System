import { AlertTriangle, Inbox } from "lucide-react";
import { Button } from "./Button";

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-3 rounded-full bg-cream p-3">
        <Inbox className="h-5 w-5 text-ink-muted" aria-hidden />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-sm text-ink-muted">{hint}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <AlertTriangle className="mb-3 h-6 w-6 text-red-600" aria-hidden />
      <p className="text-sm font-medium text-red-800">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
