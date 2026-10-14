"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import clsx from "clsx";

type ToastKind = "success" | "error";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

const ToastContext = createContext<(kind: ToastKind, message: string) => void>(() => {});
let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId++;
      setToasts((t) => [...t, { id, kind, message }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" className="fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className="flex animate-toast-in items-start gap-3 rounded-xl border border-line bg-white p-3 shadow-lg"
          >
            {t.kind === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
            )}
            <p className={clsx("flex-1 text-sm")}>{t.message}</p>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="text-ink-muted hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const push = useContext(ToastContext);
  return {
    success: (m: string) => push("success", m),
    error: (m: string) => push("error", m),
  };
};
