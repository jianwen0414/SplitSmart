"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExpenseInitial, Member, ParseExpenseResponse } from "@/lib/types";

interface Props {
  groupId: string;
  members: Member[];
  onParsed: (initial: ExpenseInitial) => void;
}

export function NaturalLanguageInput({ groupId, members, onParsed }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  const handle = async () => {
    setError(null);
    setWarn(null);
    if (!text.trim()) { setError("Type something first"); return; }
    setLoading(true);
    try {
      const res = await api.post<ParseExpenseResponse>("/ai/parse-expense", {
        text,
        group_id: groupId,
        group_members: members.map((m) => ({ user_id: m.user_id, display_name: m.display_name })),
      });
      if (!res.data.success || !res.data.data) {
        setError(res.data.error || "Could not parse");
        return;
      }
      const d = res.data.data;
      if (d.unmatched_names.length > 0) setWarn(`Unmatched names: ${d.unmatched_names.join(", ")}`);
      onParsed({
        amount: d.amount ? parseFloat(d.amount) : undefined,
        currency: d.currency || undefined,
        description: d.description || undefined,
        category: d.category || undefined,
        date: d.date || undefined,
        paid_by: d.paid_by_user_id || undefined,
        splitAmongUserIds: d.split_among_user_ids.length > 0 ? d.split_among_user_ids : undefined,
      });
    } catch (e: any) {
      setError(e?.response?.data?.detail?.message || e?.message || "Parse failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-600">Type naturally, e.g. <em>Dinner at Jalan Alor RM120 split with Amir and Priya</em>.</p>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe the expense..." />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {warn && <p className="text-sm text-amber-600">{warn}</p>}
      <Button type="button" onClick={handle} disabled={loading}>{loading ? "Parsing..." : "Parse with Gemini"}</Button>
    </div>
  );
}
