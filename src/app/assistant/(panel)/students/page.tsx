import type { Metadata } from "next";
import StudentsManager from "@/components/admin/StudentsManager";

export const metadata: Metadata = {
  title: "Students — CAIE-BIOLOGY Assistant",
};

export default function AssistantStudentsPage() {
  return <StudentsManager />;
}
