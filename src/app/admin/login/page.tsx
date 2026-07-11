import type { Metadata } from "next";
import AdminLogin from "@/components/admin/AdminLogin";

export const metadata: Metadata = {
  title: "Admin Sign In — CAIE-BIOLOGY",
  description: "Restricted admin console for CAIE-BIOLOGY staff.",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main id="main-content">
      <AdminLogin />
    </main>
  );
}
