"use client";
import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { Group, GroupDetail } from "@/lib/types";

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Group[]>("/groups");
      setGroups(res.data);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to load groups"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    groups,
    loading,
    error,
    refresh,
    create: (name: string, description: string, base_currency: string) =>
      api.post<Group>("/groups", { name, description, base_currency }).then((r) => r.data),
    join: (invite_code: string) =>
      api.post<Group>("/groups/join", { invite_code }).then((r) => r.data),
  };
}

export function useGroupDetail(groupId: string | null) {
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<GroupDetail>(`/groups/${groupId}`);
      setGroup(res.data);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to load group"));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { group, loading, error, refresh };
}
