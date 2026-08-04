import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Netlify's Next.js Runtime traces a minimal standalone server bundle
  // for deployment as serverless functions; without this it can't find
  // the expected build output shape.
  output: "standalone",
};

export default nextConfig;
