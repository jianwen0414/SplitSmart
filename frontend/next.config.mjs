/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  eslint: {
    // Lint errors (no-explicit-any, unused vars) shouldn't block prod builds.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
