import type { Metadata } from "next";
import AnnouncementsManager from "@/components/admin/AnnouncementsManager";

export const metadata: Metadata = {
  title: "Announcements — CAIE-BIOLOGY Admin",
};

export default function AnnouncementsPage() {
  return <AnnouncementsManager />;
}
