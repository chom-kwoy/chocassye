import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  distDir: "build", // Changes the build output directory to `build`
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      // fallback runs after all Next.js route handlers, so /api/auth/* and
      // /api/webhook/* are served by Next.js; everything else falls through
      // to the backend at localhost:5000.
      fallback: [
        {
          source: "/api/:path*",
          destination: `http://localhost:5000/api/:path*`,
        },
      ],
    };
  },
  images: {
    remotePatterns: [new URL("https://*.backblazeb2.com/**")],
  },
};
process.on("unhandledRejection", (error) => {
  console.log("unhandledRejection", error);
});
export default nextConfig;
