import type { Metadata } from "next";
import AssistantShell from "@/components/assistant/AssistantShell";

export const metadata: Metadata = {
  title: "Assistant — CAIE-BIOLOGY",
  robots: { index: false, follow: false },
};

export default function AssistantLayout({ children }: { children: React.ReactNode }) {
  return <AssistantShell>{children}</AssistantShell>;
}
