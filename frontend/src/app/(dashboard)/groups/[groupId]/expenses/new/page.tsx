"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGroupDetail } from "@/hooks/useGroups";
import { useExpenses } from "@/hooks/useExpenses";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ReceiptScanner } from "@/components/expenses/ReceiptScanner";
import { NaturalLanguageInput } from "@/components/expenses/NaturalLanguageInput";
import { ExpenseInitial } from "@/lib/types";

export default function NewExpensePage({ params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const router = useRouter();
  const { group, loading } = useGroupDetail(groupId);
  const { create } = useExpenses(groupId);
  const [initial, setInitial] = useState<ExpenseInitial | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("manual");

  if (loading || !group) return <p className="text-sm text-slate-500">Loading...</p>;

  const handlePrefill = (data: ExpenseInitial) => {
    setInitial(data);
    setActiveTab("manual");
  };

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>New expense</CardTitle>
          <CardDescription>Manual, scan a receipt, or describe it in plain English.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={activeTab} key={activeTab}>
            <TabsList>
              <TabsTrigger value="manual">Manual</TabsTrigger>
              <TabsTrigger value="scan">Scan receipt</TabsTrigger>
              <TabsTrigger value="quick">Quick entry</TabsTrigger>
            </TabsList>
            <TabsContent value="manual">
              <ExpenseForm
                members={group.members}
                defaultCurrency={group.base_currency}
                initial={initial}
                onSubmit={async (payload) => {
                  await create(payload);
                  router.push(`/groups/${groupId}`);
                }}
              />
            </TabsContent>
            <TabsContent value="scan">
              <ReceiptScanner groupId={groupId} onParsed={handlePrefill} />
            </TabsContent>
            <TabsContent value="quick">
              <NaturalLanguageInput groupId={groupId} members={group.members} onParsed={handlePrefill} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
