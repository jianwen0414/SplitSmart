"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SettlementPlanItem } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

interface Props {
  plan: SettlementPlanItem[];
  currentUserId: string;
  onSettle: (paid_to: string, amount: number, currency: string) => Promise<void>;
}

export function SettlementPlan({ plan, currentUserId, onSettle }: Props) {
  const [pending, setPending] = useState<string | null>(null);

  if (plan.length === 0) {
    return <p className="text-sm text-slate-500">All settled up.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {plan.map((t, i) => {
        const key = `${t.from.user_id}-${t.to.user_id}-${i}`;
        const isMyDebt = t.from.user_id === currentUserId;
        return (
          <Card key={key}>
            <CardContent className="flex items-center justify-between py-3">
              <div className="text-sm">
                <span className="font-medium text-slate-900">{t.from.display_name}</span>
                <span className="text-slate-500"> pays </span>
                <span className="font-medium text-slate-900">{t.to.display_name}</span>
                <span className="ml-2 font-semibold text-brand-700">{formatMoney(t.amount, t.currency)}</span>
              </div>
              {isMyDebt && (
                <Button
                  size="sm"
                  disabled={pending === key}
                  onClick={async () => {
                    setPending(key);
                    try {
                      await onSettle(t.to.user_id, parseFloat(t.amount), t.currency);
                    } finally {
                      setPending(null);
                    }
                  }}
                >
                  {pending === key ? "Recording..." : "I paid this"}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
