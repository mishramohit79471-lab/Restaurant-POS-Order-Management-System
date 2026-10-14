"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ManagedUser, Role } from "@/lib/types";

export interface UserFormValues {
  name: string;
  email: string;
  role: Role;
  password?: string;
}

interface Props {
  open: boolean;
  user: ManagedUser | null; // null = creating
  saving: boolean;
  serverError: string;
  isSelf: boolean;
  onSave: (v: UserFormValues) => void;
  onClose: () => void;
}

const input =
  "mt-1.5 h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 aria-[invalid=true]:border-red-400 disabled:bg-cream disabled:text-ink-muted";

export function UserFormDialog({ open, user, saving, serverError, isSelf, onSave, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      setName(user?.name ?? "");
      setEmail(user?.email ?? "");
      setRole(user?.role ?? "staff");
      setPassword("");
      setErrors({});
      el.showModal();
    }
    if (!open && el.open) el.close();
  }, [open, user]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Enter a name (at least 2 characters)";
    if (!user && !/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = "Enter a valid email address";
    if ((!user || password) && password.length < 8) errs.password = "Password must be at least 8 characters";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ name: name.trim(), email: email.trim(), role, password: password || undefined });
  }

  const err = (k: string) => errors[k] && <p id={`${k}-err`} role="alert" className="mt-1 text-xs text-red-600">{errors[k]}</p>;

  return (
    <dialog
      ref={ref}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      aria-labelledby="user-form-title"
      className="w-[calc(100vw-2rem)] max-w-md rounded-2xl border border-line bg-white p-0 shadow-xl backdrop:bg-black/40"
    >
      <form onSubmit={submit} noValidate className="p-6">
        <h2 id="user-form-title" className="text-lg font-semibold">{user ? "Edit user" : "Add user"}</h2>
        {serverError && <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>}

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="u-name" className="text-sm font-medium">Full name</label>
            <input id="u-name" className={input} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-err" : undefined} autoFocus />
            {err("name")}
          </div>
          <div>
            <label htmlFor="u-email" className="text-sm font-medium">Email</label>
            <input id="u-email" type="email" className={input} value={email} disabled={!!user} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-err" : undefined} />
            {err("email")}
          </div>
          <div>
            <label htmlFor="u-role" className="text-sm font-medium">Role</label>
            <select id="u-role" className={input} value={role} disabled={isSelf} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="staff">Staff — POS, orders, billing, availability</option>
              <option value="admin">Admin — full access</option>
            </select>
            {isSelf && <p className="mt-1 text-xs text-ink-muted">You can’t change your own role.</p>}
          </div>
          <div>
            <label htmlFor="u-pass" className="text-sm font-medium">
              {user ? "New password" : "Password"} {user && <span className="font-normal text-ink-muted">(leave blank to keep current)</span>}
            </label>
            <input id="u-pass" type="password" autoComplete="new-password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-err" : undefined} />
            {err("password")}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{user ? "Save changes" : "Create user"}</Button>
        </div>
      </form>
    </dialog>
  );
}
