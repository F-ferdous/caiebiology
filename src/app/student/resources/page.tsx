import type { Metadata } from "next";
import StudentResources from "@/components/student/StudentResources";

export const metadata: Metadata = {
  title: "Resources — CAIE-BIOLOGY Student",
};

export default function StudentResourcesPage() {
  return <StudentResources />;
}
