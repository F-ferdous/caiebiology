import type { Metadata } from "next";
import ResourcesManager from "@/components/admin/ResourcesManager";

export const metadata: Metadata = {
  title: "Resources — CAIE-BIOLOGY Assistant",
};

export default function AssistantResourcesPage() {
  return <ResourcesManager role="assistant" />;
}
