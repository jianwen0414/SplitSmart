"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), { ssr: false });

export default function LandingPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session) router.replace("/groups");
  }, [loading, session, router]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
      <div className="relative h-[60vh] min-h-[400px] overflow-hidden">
        <div className="absolute inset-0 z-0"><HeroScene /></div>
        <section className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-4 text-center">
          <h1 className="text-balance text-5xl font-bold tracking-tight text-slate-900 drop-shadow-sm sm:text-6xl">
            SplitSmart
          </h1>
          <p className="mt-4 text-lg text-slate-700">Split expenses. Not friendships.</p>
          <div className="mt-8 flex gap-3">
            <Link href="/register"><Button size="lg">Get started</Button></Link>
            <Link href="/login"><Button size="lg" variant="outline">Sign in</Button></Link>
          </div>
        </section>
      </div>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-4 pb-20 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Smart splitting</CardTitle>
            <CardDescription>Equal, exact, or percentage — the math is on us.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">Track every shared expense and see who owes whom in seconds.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI Receipt scanner</CardTitle>
            <CardDescription>Snap a photo. Gemini fills the form.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">Vertex AI extracts merchant, total, date, and category instantly.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Multi-currency</CardTitle>
            <CardDescription>Trips across borders, no math headaches.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">Log expenses in any currency — balances always reconcile to the group base.</CardContent>
        </Card>
      </section>
    </main>
  );
}
