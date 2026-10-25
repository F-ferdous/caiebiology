import type { Metadata } from "next";
import PaymentsManager from "@/components/admin/PaymentsManager";

export const metadata: Metadata = {
  title: "Payment Details — CAIE-BIOLOGY Assistant",
};

export default function AssistantPaymentsPage() {
  return <PaymentsManager role="assistant" />;
}
