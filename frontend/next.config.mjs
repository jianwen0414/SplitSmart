/** @type {import('next').NextConfig} */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

// Pragmatic CSP: locks the app down while allowing what Next.js (inline hydration
// scripts) and our backends (Supabase, API) genuinely need. 'unsafe-inline'/'unsafe-eval'
// are required by Next's runtime and dev mode; tightening to nonces is a future step.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  `connect-src 'self' ${supabaseUrl} ${apiUrl}`.trim(),
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
]
  .join("; ")
  .replace(/\s+/g, " ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig = {
  output: "standalone",
  eslint: {
    // Lint errors (no-explicit-any, unused vars) shouldn't block prod builds.
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
