import type { Metadata } from "next";
import DueListManager from "@/components/admin/DueListManager";

export const metadata: Metadata = {
  title: "Due List — CAIE-BIOLOGY Assistant",
};

export default function AssistantDueListPage() {
  return <DueListManager role="assistant" />;
}
