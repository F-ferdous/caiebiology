import type { Metadata } from "next";
import StudentNotices from "@/components/student/StudentNotices";

export const metadata: Metadata = {
  title: "Notices — CAIE-BIOLOGY Student",
};

export default function StudentNoticesPage() {
  return <StudentNotices />;
}
