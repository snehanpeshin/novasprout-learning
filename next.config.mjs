/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/api/**": ["./app/lib/apple-root-certificates/*.cer"]
  },
  images: {
    unoptimized: true
  }
};

export default nextConfig;
