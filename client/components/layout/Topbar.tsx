"use client";

import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function Topbar({ title, onMenu }: { title: string; onMenu: () => void }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const initials = user?.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-cream/90 px-4 backdrop-blur sm:px-6">
      <button onClick={onMenu} aria-label="Open menu" className="rounded-lg p-2 text-ink-muted hover:bg-black/5 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold">{title}</h1>
        <p className="hidden text-xs text-ink-muted sm:block">{today}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight">{user?.name}</p>
          <p className="text-xs capitalize text-ink-muted">{user?.role}</p>
        </div>
        <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-charcoal text-xs font-semibold text-white">
          {initials}
        </span>
        <Button variant="ghost" onClick={() => setConfirming(true)} aria-label="Sign out" className="px-2.5">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Sign out?"
        description="You will need to sign in again to continue taking orders."
        confirmLabel="Sign out"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          logout();
          toast.success("Signed out successfully");
        }}
      />
    </header>
  );
}
