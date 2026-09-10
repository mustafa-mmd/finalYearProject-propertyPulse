/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Keep Windows development/CI builds within predictable process limits.
  experimental: { cpus: 2 },
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(self)" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
    ];
    if (process.env.NODE_ENV === "production") securityHeaders.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" });
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "**",
      },
    ],
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
};

export default nextConfig;
