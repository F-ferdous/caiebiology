import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SectionPlaceholder from "@/components/admin/SectionPlaceholder";
import { adminSections, getAdminSection } from "@/lib/adminNav";

type Props = { params: Promise<{ section: string }> };

// Assistants manage every section except the Assistants module itself
const assistantSlugs = adminSections
  .filter((s) => s.slug !== "assistants")
  .map((s) => s.slug);

// Sections with a dedicated page (e.g. /assistant/batches) are excluded —
// their static route takes precedence over this placeholder.
const builtSections = ["batches", "students", "payments"];

export function generateStaticParams() {
  return assistantSlugs
    .filter((section) => !builtSections.includes(section))
    .map((section) => ({ section }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  const data = getAdminSection(section);
  return { title: `${data?.label ?? "Assistant"} — CAIE-BIOLOGY Assistant` };
}

export default async function AssistantSectionPage({ params }: Props) {
  const { section } = await params;
  const data = getAdminSection(section);
  if (!data || !assistantSlugs.includes(section)) notFound();

  return <SectionPlaceholder section={data} basePath="/assistant" />;
}
