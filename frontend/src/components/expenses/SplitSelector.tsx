"use client";
import { Member, SplitType, SplitInputPayload } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  members: Member[];
  splitType: SplitType;
  totalAmount: number;
  selected: Record<string, boolean>;
  setSelected: (m: Record<string, boolean>) => void;
  exactAmounts: Record<string, string>;
  setExactAmounts: (m: Record<string, string>) => void;
  percentages: Record<string, string>;
  setPercentages: (m: Record<string, string>) => void;
}

export function buildSplitsPayload(
  splitType: SplitType,
  selected: Record<string, boolean>,
  exactAmounts: Record<string, string>,
  percentages: Record<string, string>
): SplitInputPayload[] {
  const includedIds = Object.keys(selected).filter((k) => selected[k]);
  if (splitType === "equal") return includedIds.map((user_id) => ({ user_id }));
  if (splitType === "exact")
    return includedIds.map((user_id) => ({
      user_id,
      amount: parseFloat(exactAmounts[user_id] || "0"),
    }));
  return includedIds.map((user_id) => ({
    user_id,
    percentage: parseFloat(percentages[user_id] || "0"),
  }));
}

export function validateSplitsClientSide(
  splitType: SplitType,
  totalAmount: number,
  payload: SplitInputPayload[]
): string | null {
  if (payload.length === 0) return "Select at least one member to split with";
  if (splitType === "exact") {
    const sum = payload.reduce((acc, p) => acc + (p.amount || 0), 0);
    if (Math.abs(sum - totalAmount) > 0.01)
      return `Exact split sum (${sum.toFixed(2)}) must equal total (${totalAmount.toFixed(2)})`;
  }
  if (splitType === "percentage") {
    const sum = payload.reduce((acc, p) => acc + (p.percentage || 0), 0);
    if (Math.abs(sum - 100) > 0.01) return `Percentages (${sum.toFixed(2)}) must sum to 100`;
  }
  return null;
}

export function SplitSelector({
  members,
  splitType,
  totalAmount,
  selected,
  setSelected,
  exactAmounts,
  setExactAmounts,
  percentages,
  setPercentages,
}: Props) {
  const toggle = (uid: string) => setSelected({ ...selected, [uid]: !selected[uid] });

  return (
    <div className="flex flex-col gap-2 rounded-md border border-slate-200 p-3">
      {members.map((m) => {
        const checked = !!selected[m.user_id];
        return (
          <div key={m.user_id} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(m.user_id)}
              className="h-4 w-4"
              id={`split-${m.user_id}`}
            />
            <Label htmlFor={`split-${m.user_id}`} className="flex-1 font-normal">
              {m.display_name}
            </Label>
            {checked && splitType === "exact" && (
              <Input
                type="number"
                step="0.01"
                min="0"
                value={exactAmounts[m.user_id] ?? ""}
                onChange={(e) => setExactAmounts({ ...exactAmounts, [m.user_id]: e.target.value })}
                placeholder="0.00"
                className="w-28"
              />
            )}
            {checked && splitType === "percentage" && (
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={percentages[m.user_id] ?? ""}
                onChange={(e) => setPercentages({ ...percentages, [m.user_id]: e.target.value })}
                placeholder="%"
                className="w-24"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
