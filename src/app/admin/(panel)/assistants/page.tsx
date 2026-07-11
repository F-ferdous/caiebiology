import type { Metadata } from "next";
import AssistantsManager from "@/components/admin/AssistantsManager";

export const metadata: Metadata = {
  title: "Assistants — CAIE-BIOLOGY Admin",
};

export default function AssistantsPage() {
  return <AssistantsManager />;
}
