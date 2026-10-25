import type { Metadata } from "next";
import ParentShell from "@/components/parent/ParentShell";

export const metadata: Metadata = {
  title: "Parent — CAIE-BIOLOGY",
  robots: { index: false, follow: false },
};

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return <ParentShell>{children}</ParentShell>;
}
