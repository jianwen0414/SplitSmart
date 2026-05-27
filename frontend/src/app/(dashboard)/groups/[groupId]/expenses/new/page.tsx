"use client";
import { useState } from "react";
import Link from "next/link";
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
  const [prefillSource, setPrefillSource] = useState<"scan" | "quick" | null>(null);
  const [activeTab, setActiveTab] = useState("manual");

  if (loading || !group) return <p className="text-sm text-slate-500">Loading...</p>;

  const handlePrefill = (data: ExpenseInitial, source: "scan" | "quick") => {
    setInitial(data);
    setPrefillSource(source);
    setActiveTab("manual");
  };

  const handleTabChange = (tab: string) => {
    if (tab !== "manual") { setInitial(undefined); setPrefillSource(null); }
    setActiveTab(tab);
  };

  return (
    <div className="mx-auto max-w-xl flex flex-col gap-3">
      <Link href={`/groups/${groupId}`} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 w-fit">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {group.name}
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>New expense</CardTitle>
          <CardDescription>Manual, scan a receipt, or describe it in plain English.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="manual">Manual</TabsTrigger>
              <TabsTrigger value="scan">Scan receipt</TabsTrigger>
              <TabsTrigger value="quick">Quick entry</TabsTrigger>
            </TabsList>
            <TabsContent value="manual">
              {initial && (
                <div className="mb-4 flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-700">
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {prefillSource === "scan" ? "Form pre-filled from receipt scan" : "Form pre-filled from quick entry"} — review and confirm.
                </div>
              )}
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
              <ReceiptScanner groupId={groupId} onParsed={(data) => handlePrefill(data, "scan")} />
            </TabsContent>
            <TabsContent value="quick">
              <NaturalLanguageInput groupId={groupId} members={group.members} onParsed={(data) => handlePrefill(data, "quick")} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
