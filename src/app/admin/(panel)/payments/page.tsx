import type { Metadata } from "next";
import PaymentsManager from "@/components/admin/PaymentsManager";

export const metadata: Metadata = {
  title: "Payment Details — CAIE-BIOLOGY Admin",
};

export default function PaymentsPage() {
  return <PaymentsManager />;
}
