import type { Metadata } from "next";
import DueListManager from "@/components/admin/DueListManager";

export const metadata: Metadata = {
  title: "Due List — CAIE-BIOLOGY Admin",
};

export default function DueListPage() {
  return <DueListManager role="admin" />;
}
