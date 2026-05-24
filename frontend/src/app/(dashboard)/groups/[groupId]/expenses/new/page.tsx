"use client";
import { useRouter } from "next/navigation";
import { useGroupDetail } from "@/hooks/useGroups";
import { useExpenses } from "@/hooks/useExpenses";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

export default function NewExpensePage({ params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const router = useRouter();
  const { group, loading } = useGroupDetail(groupId);
  const { create } = useExpenses(groupId);

  if (loading || !group) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>New expense</CardTitle>
          <CardDescription>Log who paid and how to split.</CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            members={group.members}
            defaultCurrency={group.base_currency}
            onSubmit={async (payload) => {
              await create(payload);
              router.push(`/groups/${groupId}`);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
