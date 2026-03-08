import { fileURLToPath } from "url"

const outputFileTracingRoot = fileURLToPath(new URL("../", import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Avoid server-side upstream timeouts when external image hosts are unreachable.
    unoptimized: true,
  },
  webpack: (config) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        message: /multiple modules with names that only differ in casing/i,
      },
    ]
    return config
  },
}

export default nextConfig
