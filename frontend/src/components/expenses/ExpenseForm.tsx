"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CATEGORIES, CURRENCIES, Category, ExpenseCreatePayload, Member, SplitType } from "@/lib/types";
import { SplitSelector, buildSplitsPayload, validateSplitsClientSide } from "./SplitSelector";

interface Props {
  members: Member[];
  defaultCurrency: string;
  onSubmit: (p: ExpenseCreatePayload) => Promise<void>;
}

export function ExpenseForm({ members, defaultCurrency, onSubmit }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [category, setCategory] = useState<Category>("general");
  const [date, setDate] = useState(today);
  const [paidBy, setPaidBy] = useState(members[0]?.user_id ?? "");
  const [splitType, setSplitType] = useState<SplitType>("equal");

  const initSelected = useMemo(() => Object.fromEntries(members.map((m) => [m.user_id, true])), [members]);
  const [selected, setSelected] = useState<Record<string, boolean>>(initSelected);
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totalAmount = parseFloat(amount || "0");

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!description.trim()) return setError("Description required");
    if (!(totalAmount > 0)) return setError("Amount must be greater than 0");
    if (!paidBy) return setError("Select who paid");

    const splits = buildSplitsPayload(splitType, selected, exactAmounts, percentages);
    const v = validateSplitsClientSide(splitType, totalAmount, splits);
    if (v) return setError(v);

    setSubmitting(true);
    try {
      await onSubmit({
        amount: totalAmount, currency, description: description.trim(), category,
        date, paid_by: paidBy, split_type: splitType, splits,
      });
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message || err?.message || "Failed to create expense");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handle} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="desc">Description</Label>
        <Input id="desc" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Dinner at Jalan Alor" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amt">Amount</Label>
          <Input id="amt" type="number" step="0.01" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cur">Currency</Label>
          <Select id="cur" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cat">Category</Label>
          <Select id="cat" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="paid">Paid by</Label>
        <Select id="paid" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
          {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.display_name}</option>)}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stype">Split type</Label>
        <Select id="stype" value={splitType} onChange={(e) => setSplitType(e.target.value as SplitType)}>
          <option value="equal">Equal</option>
          <option value="exact">Exact amounts</option>
          <option value="percentage">Percentage</option>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Split among</Label>
        <SplitSelector
          members={members} splitType={splitType} totalAmount={totalAmount}
          selected={selected} setSelected={setSelected}
          exactAmounts={exactAmounts} setExactAmounts={setExactAmounts}
          percentages={percentages} setPercentages={setPercentages}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Add expense"}</Button>
    </form>
  );
}
