import type { Metadata } from "next";
import AnnouncementsManager from "@/components/admin/AnnouncementsManager";

export const metadata: Metadata = {
  title: "Announcements — CAIE-BIOLOGY Assistant",
};

export default function AssistantAnnouncementsPage() {
  return <AnnouncementsManager role="assistant" />;
}
