import type { Metadata } from "next";
import ParentLogin from "@/components/parent/ParentLogin";

export const metadata: Metadata = {
  title: "Parent Sign In — CAIE-BIOLOGY",
  description: "Parents sign in with their child's Student ID and phone number.",
  robots: { index: false, follow: false },
};

export default function ParentLoginPage() {
  return (
    <main id="main-content">
      <ParentLogin />
    </main>
  );
}
