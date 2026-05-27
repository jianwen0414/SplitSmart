"use client";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ItemInput, Member } from "@/lib/types";

interface Props {
  members: Member[];
  totalAmount: number;
  items: ItemInput[];
  setItems: (items: ItemInput[]) => void;
  tax: number;
  setTax: (n: number) => void;
  service: number;
  setService: (n: number) => void;
}

export function emptyItem(): ItemInput {
  return { description: "", unit_amount: 0, quantity: 1, consumers: [] };
}

export function computePerMemberSubtotals(
  items: ItemInput[],
  tax: number,
  service: number,
): Record<string, number> {
  const subtotals: Record<string, number> = {};
  let itemTotal = 0;
  for (const item of items) {
    const line = item.unit_amount * item.quantity;
    itemTotal += line;
    const totalWeight = item.consumers.reduce((acc, c) => acc + (c.share_weight ?? 1), 0);
    if (totalWeight <= 0 || item.consumers.length === 0) continue;
    for (const c of item.consumers) {
      const share = (line * (c.share_weight ?? 1)) / totalWeight;
      subtotals[c.user_id] = (subtotals[c.user_id] ?? 0) + share;
    }
  }
  const extra = tax + service;
  if (itemTotal > 0 && extra > 0) {
    for (const uid of Object.keys(subtotals)) {
      subtotals[uid] += (subtotals[uid] / itemTotal) * extra;
    }
  }
  return subtotals;
}

export function validateItemizedClientSide(
  items: ItemInput[],
  tax: number,
  service: number,
  totalAmount: number,
): string | null {
  if (items.length === 0) return "Add at least one item";
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.description.trim()) return `Item #${i + 1} needs a description`;
    if (!(item.unit_amount > 0)) return `Item #${i + 1} unit amount must be > 0`;
    if (!(item.quantity > 0)) return `Item #${i + 1} quantity must be > 0`;
    if (item.consumers.length === 0) return `Item #${i + 1} ("${item.description}") has no consumers`;
  }
  const itemTotal = items.reduce((acc, it) => acc + it.unit_amount * it.quantity, 0);
  const grand = itemTotal + tax + service;
  if (Math.abs(grand - totalAmount) > 0.01) {
    return `Items (${itemTotal.toFixed(2)}) + tax (${tax.toFixed(2)}) + service (${service.toFixed(2)}) = ${grand.toFixed(2)} ≠ total (${totalAmount.toFixed(2)})`;
  }
  return null;
}

export function ItemizedSplit({ members, totalAmount, items, setItems, tax, setTax, service, setService }: Props) {
  const subtotals = useMemo(() => computePerMemberSubtotals(items, tax, service), [items, tax, service]);
  const itemTotal = useMemo(() => items.reduce((acc, it) => acc + it.unit_amount * it.quantity, 0), [items]);
  const grand = itemTotal + tax + service;
  const grandOk = Math.abs(grand - totalAmount) < 0.01 && totalAmount > 0;

  const updateItem = (idx: number, patch: Partial<ItemInput>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    setItems(next);
  };

  const toggleConsumer = (itemIdx: number, userId: string) => {
    const item = items[itemIdx];
    const exists = item.consumers.find((c) => c.user_id === userId);
    const nextConsumers = exists
      ? item.consumers.filter((c) => c.user_id !== userId)
      : [...item.consumers, { user_id: userId, share_weight: 1 }];
    updateItem(itemIdx, { consumers: nextConsumers });
  };

  const assignAll = (itemIdx: number) => {
    updateItem(itemIdx, {
      consumers: members.map((m) => ({ user_id: m.user_id, share_weight: 1 })),
    });
  };

  const clearAll = (itemIdx: number) => {
    updateItem(itemIdx, { consumers: [] });
  };

  const addItem = () => setItems([...items, emptyItem()]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-2 py-2 text-left">Item</th>
              <th className="px-2 py-2 text-right">Qty</th>
              <th className="px-2 py-2 text-right">Unit</th>
              {members.map((m) => (
                <th key={m.user_id} className="px-2 py-2 text-center" title={m.display_name}>
                  {m.display_name.split(" ")[0].slice(0, 4)}
                </th>
              ))}
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={members.length + 4} className="px-2 py-4 text-center text-slate-400">
                  Add your first item to get started.
                </td>
              </tr>
            )}
            {items.map((item, idx) => {
              const lineTotal = item.unit_amount * item.quantity;
              return (
                <tr key={idx} className="border-t border-slate-100 align-middle">
                  <td className="px-2 py-1">
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(idx, { description: e.target.value })}
                      placeholder="e.g. Nasi Kandar"
                      className="h-9 min-w-[140px]"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, { quantity: Math.max(1, parseInt(e.target.value || "1", 10)) })}
                      className="h-9 w-16 text-right"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_amount || ""}
                      onChange={(e) => updateItem(idx, { unit_amount: parseFloat(e.target.value || "0") })}
                      className="h-9 w-24 text-right"
                      placeholder="0.00"
                    />
                  </td>
                  {members.map((m) => {
                    const checked = !!item.consumers.find((c) => c.user_id === m.user_id);
                    return (
                      <td key={m.user_id} className="px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleConsumer(idx, m.user_id)}
                          className="h-4 w-4 cursor-pointer"
                          aria-label={`${m.display_name} consumed ${item.description}`}
                        />
                      </td>
                    );
                  })}
                  <td className="px-2 py-1 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => assignAll(idx)}
                        className="text-xs text-brand-600 hover:underline"
                        title="Assign to everyone"
                      >
                        all
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        type="button"
                        onClick={() => clearAll(idx)}
                        className="text-xs text-slate-500 hover:underline"
                        title="Clear assignments"
                      >
                        none
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-xs text-red-600 hover:underline"
                        title="Remove item"
                      >
                        ×
                      </button>
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-400">line {lineTotal.toFixed(2)}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addItem} className="w-fit">
        + Add item
      </Button>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tax">Tax (SST)</Label>
          <Input
            id="tax"
            type="number"
            min="0"
            step="0.01"
            value={tax || ""}
            onChange={(e) => setTax(parseFloat(e.target.value || "0"))}
            placeholder="0.00"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="service">Service charge</Label>
          <Input
            id="service"
            type="number"
            min="0"
            step="0.01"
            value={service || ""}
            onChange={(e) => setService(parseFloat(e.target.value || "0"))}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Items subtotal</span>
          <span className="font-medium">{itemTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Tax + service</span>
          <span className="font-medium">{(tax + service).toFixed(2)}</span>
        </div>
        <div className={`mt-1 flex justify-between border-t border-slate-200 pt-1 font-semibold ${grandOk ? "text-emerald-700" : "text-red-600"}`}>
          <span>Grand total</span>
          <span>
            {grand.toFixed(2)} / {totalAmount.toFixed(2)} {grandOk ? "✓" : "✗"}
          </span>
        </div>
        {members.some((m) => (subtotals[m.user_id] ?? 0) > 0) && (
          <div className="mt-2 border-t border-slate-200 pt-2">
            <p className="mb-1 text-slate-500">Per person:</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {members.map((m) => {
                const v = subtotals[m.user_id] ?? 0;
                if (v <= 0) return null;
                return (
                  <span key={m.user_id} className="font-mono">
                    <span className="text-slate-600">{m.display_name}:</span> {v.toFixed(2)}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
