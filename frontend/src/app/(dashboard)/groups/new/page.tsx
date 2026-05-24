"use client";
import { useRouter } from "next/navigation";
import { useGroups } from "@/hooks/useGroups";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GroupForm } from "@/components/groups/GroupForm";

export default function NewGroupPage() {
  const router = useRouter();
  const { create, refresh } = useGroups();

  const handle = async (name: string, description: string, base_currency: string) => {
    const g = await create(name, description, base_currency);
    await refresh();
    router.push(`/groups/${g.id}`);
  };

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>New group</CardTitle>
          <CardDescription>Create a group, then share the invite code.</CardDescription>
        </CardHeader>
        <CardContent>
          <GroupForm onSubmit={handle} />
        </CardContent>
      </Card>
    </div>
  );
}
