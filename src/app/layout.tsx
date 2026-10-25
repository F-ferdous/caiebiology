import type { Metadata, Viewport } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "CAIE-BIOLOGY — Biology Learning Platform for CAIE Students",
  description:
    "CAIE-BIOLOGY is a modern biology education platform for CAIE students and teachers. Access curated resources, join live classes, and get AI-powered tutoring tailored to the CAIE curriculum.",
  keywords: ["CAIE biology", "biology education", "A-level biology", "online learning", "AI tutor"],
  // Installable PWA — home-screen title and iOS standalone behaviour.
  applicationName: "CAIE-BIOLOGY",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CAIE-BIOLOGY",
  },
  icons: {
    icon: "/icons/icon-32.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "CAIE-BIOLOGY — Biology Learning Platform",
    description: "Modern biology education for CAIE students — resources, live classes, and AI tutoring.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#A51212",
};

// Inline script to prevent flash of wrong theme (FOUC)
const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('bioedu-theme');
    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
