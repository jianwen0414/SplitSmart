"use client";
import Link from "next/link";
import { useGroupDetail } from "@/hooks/useGroups";
import { useExpenses, useBalances } from "@/hooks/useExpenses";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ExpenseCard } from "@/components/expenses/ExpenseCard";
import { BalanceSummary } from "@/components/balances/BalanceSummary";
import { SettlementPlan } from "@/components/balances/SettlementPlan";

export default function GroupDetailPage({ params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const { group, loading: gLoading } = useGroupDetail(groupId);
  const { expenses, loading: eLoading, refresh: refreshExpenses } = useExpenses(groupId);
  const { data: balances, loading: bLoading, refresh: refreshBalances, settle } = useBalances(groupId);
  const { user } = useAuth();

  if (gLoading || !group) return <p className="text-sm text-slate-500">Loading group...</p>;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{group.name}</h1>
          <p className="text-sm text-slate-500">
            {group.description || "No description"} ·{" "}
            <span className="font-mono">code: {group.invite_code}</span>
          </p>
        </div>
        <Link href={`/groups/${groupId}/expenses/new`}><Button>Add expense</Button></Link>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-base">Members</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {group.members.map((m) => (
            <Badge key={m.user_id} variant={m.role === "admin" ? "brand" : "default"}>{m.display_name}</Badge>
          ))}
        </CardContent>
      </Card>

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
        </TabsList>
        <TabsContent value="expenses">
          {eLoading && <p className="text-sm text-slate-500">Loading expenses...</p>}
          {!eLoading && expenses.length === 0 && <p className="text-sm text-slate-500">No expenses yet.</p>}
          <div className="flex flex-col gap-2">
            {expenses.map((ex) => <ExpenseCard key={ex.id} expense={ex} members={group.members} />)}
          </div>
        </TabsContent>
        <TabsContent value="balances">
          {bLoading || !balances ? (
            <p className="text-sm text-slate-500">Loading balances...</p>
          ) : (
            <div className="flex flex-col gap-6">
              <BalanceSummary balances={balances.balances} currency={group.base_currency} />
              <div>
                <h2 className="mb-2 text-base font-semibold text-slate-900">Settlement plan</h2>
                <SettlementPlan
                  plan={balances.settlement_plan}
                  currentUserId={user?.id ?? ""}
                  onSettle={async (paid_to, amount, currency) => {
                    await settle(paid_to, amount, currency);
                    await Promise.all([refreshBalances(), refreshExpenses()]);
                  }}
                />
              </div>
              {balances.is_settled && (
                <p className="text-center text-sm font-medium text-emerald-600">All settled up.</p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
