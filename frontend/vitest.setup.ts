import "@testing-library/jest-dom/vitest";

// Provide dummy public env so modules that read them at import time
// (lib/supabase, lib/api) don't throw their "missing env" guard under jsdom.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= "test-anon-key";
process.env.NEXT_PUBLIC_API_URL ||= "http://localhost:8000";
