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
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setSuccess(false);
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
      const parsed: ExpenseInitial = {
        amount: d.total_amount ? parseFloat(d.total_amount) : undefined,
        currency: d.currency || undefined,
        description: d.merchant || undefined,
        category: d.category || undefined,
        date: d.date || undefined,
        receipt_url: res.data.receipt_url,
      };
      setSuccess(true);
      setTimeout(() => onParsed(parsed), 900);
    } catch (e: any) {
      setError(e?.response?.data?.detail?.message || e?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 pt-2">
      <p className="text-sm text-slate-600">Upload a photo of the receipt. Gemini extracts merchant, total, date, and category — you confirm before saving.</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      {success ? (
        <div className="flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Receipt scanned successfully.
        </div>
      ) : (
        <Button type="button" onClick={() => inputRef.current?.click()} disabled={loading}>
          {loading ? "Scanning..." : "Choose receipt image"}
        </Button>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
