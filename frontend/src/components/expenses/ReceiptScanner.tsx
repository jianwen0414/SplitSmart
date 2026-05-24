"use client";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ExpenseInitial, ReceiptScanResponse } from "@/lib/types";

interface Props {
  groupId: string;
  onParsed: (initial: ExpenseInitial) => void;
}

export function ReceiptScanner({ groupId, onParsed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("group_id", groupId);
      const res = await api.post<ReceiptScanResponse>("/ai/scan-receipt", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!res.data.success || !res.data.data) {
        setError(res.data.error || "Could not parse receipt");
        return;
      }
      const d = res.data.data;
      onParsed({
        amount: d.total_amount ? parseFloat(d.total_amount) : undefined,
        currency: d.currency || undefined,
        description: d.merchant || undefined,
        category: d.category || undefined,
        date: d.date || undefined,
        receipt_url: res.data.receipt_url,
      });
    } catch (e: any) {
      setError(e?.response?.data?.detail?.message || e?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-600">Upload a photo of the receipt. Gemini extracts merchant, total, date, and category — you confirm before saving.</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <Button type="button" onClick={() => inputRef.current?.click()} disabled={loading}>
        {loading ? "Scanning..." : "Choose receipt image"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
