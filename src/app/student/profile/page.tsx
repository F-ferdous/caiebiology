import type { Metadata } from "next";
import StudentProfile from "@/components/student/StudentProfile";

export const metadata: Metadata = {
  title: "Profile — CAIE-BIOLOGY Student",
};

export default function StudentProfilePage() {
  return <StudentProfile />;
}
