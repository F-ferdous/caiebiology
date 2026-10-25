import type { Metadata } from "next";
import ResourcesManager from "@/components/admin/ResourcesManager";

export const metadata: Metadata = {
  title: "Resources — CAIE-BIOLOGY Admin",
};

export default function ResourcesPage() {
  return <ResourcesManager />;
}
