"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session) router.replace("/groups");
  }, [loading, session, router]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
      <section className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-balance text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
          SplitSmart
        </h1>
        <p className="mt-4 text-lg text-slate-600">Split expenses. Not friendships.</p>
        <div className="mt-8 flex gap-3">
          <Link href="/register"><Button size="lg">Get started</Button></Link>
          <Link href="/login"><Button size="lg" variant="outline">Sign in</Button></Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-4 pb-20 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Smart splitting</CardTitle>
            <CardDescription>Equal, exact, or percentage — the math is on us.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Track every shared expense and see who owes whom in seconds.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Minimal settlements</CardTitle>
            <CardDescription>Fewer transactions to close the books.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            A greedy debt-simplification algorithm finds the shortest path to zero.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Built for groups</CardTitle>
            <CardDescription>Trips, dinners, flatmates.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Invite friends with a shareable code. Everyone sees the same balances.
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
