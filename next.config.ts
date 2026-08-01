import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully client-side app (Firebase from the browser, no server routes) — export
  // to static HTML/JS so it can deploy to classic Firebase Hosting.
  output: "export",
  // The default image loader needs a server; static export must serve originals.
  images: { unoptimized: true },
};

export default nextConfig;
