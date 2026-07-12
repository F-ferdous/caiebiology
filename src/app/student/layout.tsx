import type { Metadata } from "next";
import StudentShell from "@/components/student/StudentShell";

export const metadata: Metadata = {
  title: "Student — CAIE-BIOLOGY",
  robots: { index: false, follow: false },
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <StudentShell>{children}</StudentShell>;
}
