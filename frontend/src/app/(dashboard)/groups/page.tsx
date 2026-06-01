"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGroups } from "@/hooks/useGroups";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GroupCard } from "@/components/groups/GroupCard";
import { getErrorMessage } from "@/lib/api";

export default function GroupsListPage() {
  const { groups, loading, error, refresh, join } = useGroups();
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    setJoining(true);
    try {
      const g = await join(inviteCode.trim());
      await refresh();
      router.push(`/groups/${g.id}`);
    } catch (err: unknown) {
      setJoinError(getErrorMessage(err, "Failed to join"));
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Your groups</h1>
        <Link href="/groups/new">
          <Button>New group</Button>
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Join with invite code</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 flex flex-col gap-1.5">
              <Label htmlFor="invite">Invite code</Label>
              <Input
                id="invite"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="8-character code"
              />
            </div>
            <Button type="submit" disabled={joining || !inviteCode.trim()}>
              {joining ? "Joining..." : "Join"}
            </Button>
          </form>
          {joinError && <p className="mt-2 text-sm text-red-600">{joinError}</p>}
        </CardContent>
      </Card>

      {loading && <p className="text-sm text-slate-500">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && groups.length === 0 && (
        <p className="text-sm text-slate-500">
          No groups yet. Create one or join with an invite code.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <GroupCard key={g.id} group={g} />
        ))}
      </div>
    </div>
  );
}
