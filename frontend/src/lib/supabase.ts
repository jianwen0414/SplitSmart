"use client";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if ((!url || !anon) && typeof window !== "undefined") {
  throw new Error(
    "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.local (see .env.local.example)."
  );
}

export const supabase = createClient(url || "", anon || "", {
  auth: { persistSession: true, autoRefreshToken: true },
});
