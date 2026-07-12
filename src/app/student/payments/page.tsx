import type { Metadata } from "next";
import StudentPayments from "@/components/student/StudentPayments";

export const metadata: Metadata = {
  title: "Payment Info — CAIE-BIOLOGY Student",
};

export default function StudentPaymentsPage() {
  return <StudentPayments />;
}
