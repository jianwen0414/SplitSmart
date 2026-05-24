import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Group } from "@/lib/types";

export function GroupCard({ group }: { group: Group }) {
  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="transition hover:shadow-md hover:border-brand-300">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle>{group.name}</CardTitle>
            <Badge variant="brand">{group.base_currency}</Badge>
          </div>
          {group.description && <CardDescription>{group.description}</CardDescription>}
        </CardHeader>
        <CardContent className="text-sm text-slate-500">
          Invite code: <span className="font-mono text-slate-700">{group.invite_code}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
