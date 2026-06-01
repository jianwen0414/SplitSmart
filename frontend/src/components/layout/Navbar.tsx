"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/groups" className="text-lg font-semibold text-brand-700">
          SplitSmart
        </Link>
        <div className="flex items-center gap-3">
          {user && (
            <>
              <span className="hidden text-sm text-slate-500 sm:inline">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Sign out
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
