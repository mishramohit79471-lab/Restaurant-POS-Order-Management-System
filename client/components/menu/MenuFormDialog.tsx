"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { MenuItem } from "@/lib/types";

export interface MenuFormValues {
  name: string;
  category: string;
  price: number;
  description: string;
}

interface Props {
  open: boolean;
  item: MenuItem | null; // null = creating
  categories: string[];
  saving: boolean;
  serverError: string;
  onSave: (values: MenuFormValues) => void;
  onClose: () => void;
}

const input =
  "mt-1.5 h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 aria-[invalid=true]:border-red-400";

export function MenuFormDialog({ open, item, categories, saving, serverError, onSave, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      setName(item?.name ?? "");
      setCategory(item?.category ?? "");
      setPrice(item ? String(item.price) : "");
      setDescription(item?.description ?? "");
      setErrors({});
      el.showModal();
    }
    if (!open && el.open) el.close();
  }, [open, item]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Enter a name (at least 2 characters)";
    if (category.trim().length < 2) errs.category = "Choose or enter a category";
    const p = Number(price);
    if (price.trim() === "" || Number.isNaN(p) || p < 0) errs.price = "Enter a valid price";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ name: name.trim(), category: category.trim(), price: Math.round(p * 100) / 100, description: description.trim() });
  }

  const err = (k: string) => errors[k] && <p id={`${k}-err`} role="alert" className="mt-1 text-xs text-red-600">{errors[k]}</p>;

  return (
    <dialog
      ref={ref}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      aria-labelledby="menu-form-title"
      className="w-[calc(100vw-2rem)] max-w-md rounded-2xl border border-line bg-white p-0 shadow-xl backdrop:bg-black/40"
    >
      <form onSubmit={submit} noValidate className="p-6">
        <h2 id="menu-form-title" className="text-lg font-semibold">{item ? "Edit menu item" : "Add menu item"}</h2>

        {serverError && <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>}

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="mi-name" className="text-sm font-medium">Name</label>
            <input id="mi-name" className={input} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-err" : undefined} autoFocus />
            {err("name")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="mi-cat" className="text-sm font-medium">Category</label>
              <input id="mi-cat" list="mi-cats" className={input} value={category} onChange={(e) => setCategory(e.target.value)} aria-invalid={!!errors.category} aria-describedby={errors.category ? "category-err" : undefined} />
              <datalist id="mi-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
              {err("category")}
            </div>
            <div>
              <label htmlFor="mi-price" className="text-sm font-medium">Price (₹)</label>
              <input id="mi-price" type="number" inputMode="decimal" min="0" step="0.01" className={input} value={price} onChange={(e) => setPrice(e.target.value)} aria-invalid={!!errors.price} aria-describedby={errors.price ? "price-err" : undefined} />
              {err("price")}
            </div>
          </div>
          <div>
            <label htmlFor="mi-desc" className="text-sm font-medium">Description <span className="font-normal text-ink-muted">(optional)</span></label>
            <textarea id="mi-desc" rows={2} maxLength={200} className={`${input} h-auto py-2`} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{item ? "Save changes" : "Add item"}</Button>
        </div>
      </form>
    </dialog>
  );
}
