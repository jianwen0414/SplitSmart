import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Expense, Member } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export function ExpenseCard({ expense, members, baseCurrency }: { expense: Expense; members: Member[]; baseCurrency?: string }) {
  const payer = members.find((m) => m.user_id === expense.paid_by);
  const isConverted = expense.converted_amount && baseCurrency && expense.currency.toUpperCase() !== baseCurrency.toUpperCase();
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900">{expense.description}</span>
            <Badge>{expense.category}</Badge>
            <Badge variant="brand">{expense.split_type}</Badge>
            {expense.receipt_url && <Badge variant="success">receipt</Badge>}
          </div>
          <p className="text-xs text-slate-500">
            Paid by {payer?.display_name ?? "—"} · {expense.date}
          </p>
        </div>
        <div className="text-right">
          {isConverted ? (
            <>
              <div className="font-semibold text-slate-900">{formatMoney(expense.converted_amount!, baseCurrency!)}</div>
              <div className="text-xs text-slate-500">{formatMoney(expense.amount, expense.currency)}</div>
            </>
          ) : (
            <div className="font-semibold text-slate-900">{formatMoney(expense.amount, expense.currency)}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
