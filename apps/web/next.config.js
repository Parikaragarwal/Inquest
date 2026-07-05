/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    // Tree-shake heavy packages to reduce JS bundle size
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
