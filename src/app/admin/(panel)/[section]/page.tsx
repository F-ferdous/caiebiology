import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SectionPlaceholder from "@/components/admin/SectionPlaceholder";
import { adminSections, getAdminSection } from "@/lib/adminNav";

type Props = { params: Promise<{ section: string }> };

// Sections with a dedicated page (e.g. /admin/assistants) are excluded —
// their static route takes precedence over this placeholder.
const builtSections = ["assistants", "batches", "students"];

export function generateStaticParams() {
  return adminSections
    .filter((s) => !builtSections.includes(s.slug))
    .map((s) => ({ section: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  const data = getAdminSection(section);
  return { title: `${data?.label ?? "Admin"} — CAIE-BIOLOGY Admin` };
}

export default async function AdminSectionPage({ params }: Props) {
  const { section } = await params;
  const data = getAdminSection(section);
  if (!data) notFound();

  return <SectionPlaceholder section={data} />;
}
