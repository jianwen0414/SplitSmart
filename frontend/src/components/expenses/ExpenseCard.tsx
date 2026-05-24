import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Expense, Member } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export function ExpenseCard({ expense, members }: { expense: Expense; members: Member[] }) {
  const payer = members.find((m) => m.user_id === expense.paid_by);
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900">{expense.description}</span>
            <Badge>{expense.category}</Badge>
            <Badge variant="brand">{expense.split_type}</Badge>
          </div>
          <p className="text-xs text-slate-500">
            Paid by {payer?.display_name ?? "—"} · {expense.date}
          </p>
        </div>
        <div className="text-right font-semibold text-slate-900">
          {formatMoney(expense.amount, expense.currency)}
        </div>
      </CardContent>
    </Card>
  );
}
