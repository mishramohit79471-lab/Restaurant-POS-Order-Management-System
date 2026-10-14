"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { UtensilsCrossed, X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { useAuth } from "@/lib/auth";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname();
  const { user } = useAuth();
  const items = NAV_ITEMS.filter((i) => !i.roles || (user && i.roles.includes(user.role)));

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-charcoal text-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand">
              <UtensilsCrossed className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-lg font-semibold tracking-tight">DineFlow</span>
          </div>
          <button onClick={onClose} aria-label="Close menu" className="rounded-md p-1 text-white/70 hover:text-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Main" className="mt-2 flex-1 space-y-1 px-3">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-brand text-white" : "text-white/70 hover:bg-charcoal-soft hover:text-white"
                )}
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>

        <p className="px-6 py-4 text-xs text-white/40">DineFlow POS v1.0</p>
      </aside>
    </>
  );
}
