import type { MetadataRoute } from "next";

// Required so the manifest is emitted as a static file under `output: export`.
export const dynamic = "force-static";

// Web app manifest — lets students/admins install the site to their home screen
// and is required for push notifications on iOS (installed PWAs only).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CAIE-BIOLOGY",
    short_name: "CAIE-BIO",
    description:
      "CAIE-BIOLOGY — classes, resources, payments, and notices for enrolled students.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F5F2EE",
    theme_color: "#A51212",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
