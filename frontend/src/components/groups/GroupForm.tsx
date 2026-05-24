"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CURRENCIES } from "@/lib/types";

export function GroupForm({ onSubmit }: { onSubmit: (name: string, description: string, base_currency: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("MYR");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(name.trim(), description.trim(), currency);
    } catch (err: any) {
      setError(err?.response?.data?.detail?.message || err?.message || "Failed to create group");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handle} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="g-name">Name</Label>
        <Input id="g-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. KL Trip 2026" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="g-desc">Description</Label>
        <Textarea id="g-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="g-cur">Base currency</Label>
        <Select id="g-cur" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create group"}</Button>
    </form>
  );
}
