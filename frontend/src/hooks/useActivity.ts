"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Activity, ActivityAction } from "@/lib/types";

export function useActivity(groupId: string | null) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ActivityAction | "all">("all");

  const refresh = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filter !== "all") params.type = filter;
      const res = await api.get<Activity[]>(`/groups/${groupId}/activities`, { params });
      setActivities(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail?.message || e?.message || "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [groupId, filter]);

  useEffect(() => { refresh(); }, [refresh]);

  return { activities, loading, error, filter, setFilter, refresh };
}
