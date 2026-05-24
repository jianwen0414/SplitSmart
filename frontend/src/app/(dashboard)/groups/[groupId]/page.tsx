"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useGroupDetail } from "@/hooks/useGroups";
import { useExpenses, useBalances } from "@/hooks/useExpenses";
import { useActivity } from "@/hooks/useActivity";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ExpenseCard } from "@/components/expenses/ExpenseCard";
import { BalanceSummary } from "@/components/balances/BalanceSummary";
import { SettlementPlan } from "@/components/balances/SettlementPlan";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { SpendingByCategory } from "@/components/dashboard/SpendingByCategory";
import { SpendingOverTime } from "@/components/dashboard/SpendingOverTime";
import { MemberContribution } from "@/components/dashboard/MemberContribution";
import { formatMoney } from "@/lib/utils";

const SettlementConfetti = dynamic(() => import("@/components/three/SettlementConfetti"), { ssr: false });

export default function GroupDetailPage({ params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const { group, loading: gLoading } = useGroupDetail(groupId);
  const { expenses, loading: eLoading, refresh: refreshExpenses } = useExpenses(groupId);
  const { data: balances, loading: bLoading, refresh: refreshBalances, settle } = useBalances(groupId);
  const { activities, filter, setFilter, refresh: refreshActivity } = useActivity(groupId);
  const { data: analytics, refresh: refreshAnalytics } = useAnalytics(groupId);
  const { user } = useAuth();

  const [showConfetti, setShowConfetti] = useState(false);
  const prevSettled = useRef(false);

  useEffect(() => {
    if (!balances) return;
    const settledNow = balances.is_settled && balances.balances.length > 0;
    if (settledNow && !prevSettled.current) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(t);
    }
    prevSettled.current = settledNow;
  }, [balances]);

  if (gLoading || !group) return <p className="text-sm text-slate-500">Loading group...</p>;

  return (
    <div className="flex flex-col gap-6">
      {showConfetti && <SettlementConfetti />}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{group.name}</h1>
          <p className="text-sm text-slate-500">
            {group.description || "No description"} ·{" "}
            <span className="font-mono">code: {group.invite_code}</span> · base {group.base_currency}
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
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          {eLoading && <p className="text-sm text-slate-500">Loading expenses...</p>}
          {!eLoading && expenses.length === 0 && <p className="text-sm text-slate-500">No expenses yet.</p>}
          <div className="flex flex-col gap-2">
            {expenses.map((ex) => <ExpenseCard key={ex.id} expense={ex} members={group.members} baseCurrency={group.base_currency} />)}
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
                    await Promise.all([refreshBalances(), refreshExpenses(), refreshActivity(), refreshAnalytics()]);
                  }}
                />
              </div>
              {balances.is_settled && (
                <p className="text-center text-sm font-medium text-emerald-600">All settled up.</p>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity">
          <ActivityFeed
            activities={activities}
            members={group.members}
            filter={filter}
            setFilter={setFilter}
          />
        </TabsContent>

        <TabsContent value="dashboard">
          {!analytics ? (
            <p className="text-sm text-slate-500">Loading analytics...</p>
          ) : (
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Total spending</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-slate-900">{formatMoney(analytics.total_spending, analytics.currency)}</div>
                  <div className="text-xs text-slate-500">{analytics.expense_count} expenses</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">By category</CardTitle></CardHeader>
                <CardContent><SpendingByCategory data={analytics.by_category} /></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Over time</CardTitle></CardHeader>
                <CardContent><SpendingOverTime data={analytics.by_date} /></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Member contribution</CardTitle></CardHeader>
                <CardContent><MemberContribution data={analytics.by_member} /></CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
