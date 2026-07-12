import type { Metadata } from "next";
import StudentTests from "@/components/student/StudentTests";

export const metadata: Metadata = {
  title: "Tests & Quizzes — CAIE-BIOLOGY Student",
};

export default function StudentTestsPage() {
  return <StudentTests />;
}
