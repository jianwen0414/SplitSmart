"use client";
import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { Expense, ExpenseCreatePayload, BalanceResponse } from "@/lib/types";

export function useExpenses(groupId: string | null) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Expense[]>(`/groups/${groupId}/expenses`);
      setExpenses(res.data);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to load expenses"));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    expenses,
    loading,
    error,
    refresh,
    create: (payload: ExpenseCreatePayload) =>
      api.post<Expense>(`/groups/${groupId}/expenses`, payload).then((r) => r.data),
    remove: (expenseId: string) => api.delete(`/groups/${groupId}/expenses/${expenseId}`),
  };
}

export function useBalances(groupId: string | null) {
  const [data, setData] = useState<BalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<BalanceResponse>(`/groups/${groupId}/balances`);
      setData(res.data);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to load balances"));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    data,
    loading,
    error,
    refresh,
    settle: (paid_to: string, amount: number, currency: string, note?: string) =>
      api.post(`/groups/${groupId}/settlements`, { paid_to, amount, currency, note }),
  };
}
