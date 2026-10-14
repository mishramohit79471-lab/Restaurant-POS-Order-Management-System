"use client";

import { useEffect, useRef } from "react";
import { Button } from "./Button";

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", danger, loading, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  // Native <dialog> gives focus trapping, Esc to close and a backdrop for free.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
      className="w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-line bg-white p-0 shadow-xl backdrop:bg-black/40"
    >
      <div className="p-6">
        <h2 id="confirm-title" className="text-lg font-semibold">{title}</h2>
        <p id="confirm-desc" className="mt-2 text-sm text-ink-muted">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} autoFocus>Cancel</Button>
          <Button variant={danger ? "danger" : "primary"} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </dialog>
  );
}
