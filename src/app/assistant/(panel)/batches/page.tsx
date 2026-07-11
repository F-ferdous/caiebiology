import type { Metadata } from "next";
import BatchesManager from "@/components/admin/BatchesManager";

export const metadata: Metadata = {
  title: "Batches — CAIE-BIOLOGY Assistant",
};

export default function AssistantBatchesPage() {
  return <BatchesManager />;
}
