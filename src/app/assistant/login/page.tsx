import type { Metadata } from "next";
import AssistantLogin from "@/components/assistant/AssistantLogin";

export const metadata: Metadata = {
  title: "Assistant Sign In — CAIE-BIOLOGY",
  description: "Sign in to the CAIE-BIOLOGY assistant portal.",
  robots: { index: false, follow: false },
};

export default function AssistantLoginPage() {
  return (
    <main id="main-content">
      <AssistantLogin />
    </main>
  );
}
