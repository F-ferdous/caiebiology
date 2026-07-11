import type { Metadata } from "next";
import BatchesManager from "@/components/admin/BatchesManager";

export const metadata: Metadata = {
  title: "Batches — CAIE-BIOLOGY Admin",
};

export default function BatchesPage() {
  return <BatchesManager />;
}
