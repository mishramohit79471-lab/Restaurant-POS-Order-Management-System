"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ShieldAlert } from "lucide-react";
import type { Role } from "@/lib/types";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ title, roles, children }: { title: string; roles?: Role[]; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center" role="status" aria-label="Loading">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-2">
        Skip to content
      </a>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-64">
        <Topbar title={title} onMenu={() => setMenuOpen(true)} />
        <main id="main" className="mx-auto max-w-7xl p-4 sm:p-6">
          {roles && !roles.includes(user.role) ? (
            <div role="alert" className="mx-auto mt-16 max-w-sm text-center">
              <ShieldAlert className="mx-auto h-10 w-10 text-ink-muted" aria-hidden />
              <h2 className="mt-3 text-lg font-semibold">Admins only</h2>
              <p className="mt-1 text-sm text-ink-muted">Your account does not have permission to view this page.</p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
