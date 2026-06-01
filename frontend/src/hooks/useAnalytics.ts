"use client";
import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { AnalyticsResponse } from "@/lib/types";

export function useAnalytics(groupId: string | null) {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<AnalyticsResponse>(`/groups/${groupId}/analytics`);
      setData(res.data);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to load analytics"));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
