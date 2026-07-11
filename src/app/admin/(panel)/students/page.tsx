import type { Metadata } from "next";
import StudentsManager from "@/components/admin/StudentsManager";

export const metadata: Metadata = {
  title: "Students — CAIE-BIOLOGY Admin",
};

export default function StudentsPage() {
  return <StudentsManager />;
}
