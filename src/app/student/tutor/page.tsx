import type { Metadata } from "next";
import StudentTutor from "@/components/student/StudentTutor";

export const metadata: Metadata = {
  title: "AI Tutor — CAIE-BIOLOGY Student",
};

export default function StudentTutorPage() {
  return <StudentTutor />;
}
