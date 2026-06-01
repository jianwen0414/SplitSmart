"use client";
import { useRef, useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ExpenseInitial, ItemInput, ReceiptScanResponse } from "@/lib/types";

// Delay before handing parsed data to the form, so the success state is visible.
const SUCCESS_DISPLAY_MS = 900;

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
      const totalNum = d.total_amount ? parseFloat(d.total_amount) : 0;

      const items: ItemInput[] = (d.line_items ?? [])
        .filter((li) => li.description && li.amount != null)
        .map((li) => ({
          description: li.description ?? "",
          unit_amount: parseFloat(li.amount ?? "0"),
          quantity: li.quantity && li.quantity > 0 ? li.quantity : 1,
          consumers: [],
        }));
      const itemSum = items.reduce((acc, it) => acc + it.unit_amount * it.quantity, 0);
      const taxAndService = Math.max(0, totalNum - itemSum);

      const parsed: ExpenseInitial = {
        amount: totalNum || undefined,
        currency: d.currency || undefined,
        description: d.merchant || undefined,
        category: d.category || undefined,
        date: d.date || undefined,
        receipt_url: res.data.receipt_url,
      };

      if (items.length > 0 && totalNum > 0) {
        parsed.split_type = "itemized";
        parsed.items = items;
        parsed.tax_amount = taxAndService > 0.01 ? Math.round(taxAndService * 100) / 100 : 0;
        parsed.service_charge_amount = 0;
      }

      setSuccess(true);
      setTimeout(() => onParsed(parsed), SUCCESS_DISPLAY_MS);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Upload failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 pt-2">
      <p className="text-sm text-slate-600">
        Upload a photo of the receipt. Gemini extracts merchant, total, date, line items, and
        category. The form pre-fills in <strong>By items</strong> mode — tap who consumed each item,
        confirm, save.
      </p>
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
