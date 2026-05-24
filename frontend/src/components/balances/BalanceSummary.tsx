import { Card, CardContent } from "@/components/ui/card";
import { MemberBalance } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export function BalanceSummary({ balances, currency }: { balances: MemberBalance[]; currency: string }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {balances.map((b) => {
        const net = parseFloat(b.net_balance);
        const positive = net > 0.005;
        const negative = net < -0.005;
        return (
          <Card key={b.user_id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-slate-900">{b.display_name}</p>
                <p className="text-xs text-slate-500">paid {formatMoney(b.total_paid, currency)} · owes {formatMoney(b.total_owed, currency)}</p>
              </div>
              <span className={`text-lg font-semibold ${positive ? "text-emerald-600" : negative ? "text-red-600" : "text-slate-500"}`}>
                {positive ? "+" : ""}{formatMoney(net, currency)}
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
