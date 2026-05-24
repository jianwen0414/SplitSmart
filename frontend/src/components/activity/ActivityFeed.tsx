"use client";
import { Activity, ActivityAction, Member } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const FILTERS: { key: ActivityAction | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "expense_created", label: "Expenses" },
  { key: "settlement_created", label: "Settlements" },
  { key: "member_joined", label: "Members" },
];

function describe(a: Activity, name: string): string {
  const m = (a.metadata || {}) as Record<string, unknown>;
  switch (a.action) {
    case "expense_created":
      return `${name} added expense "${m.description ?? ""}" (${m.currency ?? ""} ${m.amount ?? ""})`;
    case "expense_updated":
      return `${name} updated expense "${m.description ?? ""}"`;
    case "expense_deleted":
      return `${name} deleted expense "${m.description ?? ""}"`;
    case "settlement_created":
      return `${name} paid ${m.paid_to_name ?? ""} ${m.currency ?? ""} ${m.amount ?? ""}`;
    case "member_joined":
      return `${m.member_name ?? name} joined the group`;
    case "member_left":
      return `${m.member_name ?? name} left the group`;
    case "group_updated":
      return `${name} updated group details`;
    default:
      return a.action;
  }
}

export function ActivityFeed({
  activities, members, filter, setFilter,
}: {
  activities: Activity[];
  members: Member[];
  filter: ActivityAction | "all";
  setFilter: (f: ActivityAction | "all") => void;
}) {
  const nameOf = (uid: string) => members.find((m) => m.user_id === uid)?.display_name ?? "Someone";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              filter === f.key ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-100",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      {activities.length === 0 && <p className="text-sm text-slate-500">No activity yet.</p>}
      <div className="flex flex-col gap-2">
        {activities.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex items-center justify-between py-3 text-sm">
              <span className="text-slate-800">{describe(a, nameOf(a.user_id))}</span>
              <Badge>{new Date(a.created_at).toLocaleString()}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
