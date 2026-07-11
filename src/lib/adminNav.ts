export type AdminSection = {
  slug: string;
  label: string;
  icon: string;
  description: string;
};

export const adminSections: AdminSection[] = [
  {
    slug: "students",
    label: "Students",
    icon: "ti-users",
    description: "Manage enrolled students, profiles, and progress tracking.",
  },
  {
    slug: "assistants",
    label: "Assistants",
    icon: "ti-user-cog",
    description: "Manage teaching assistants and their access permissions.",
  },
  {
    slug: "batches",
    label: "Batches",
    icon: "ti-stack-2",
    description: "Organize student batches, schedules, and capacity.",
  },
  {
    slug: "resources",
    label: "Resources",
    icon: "ti-books",
    description: "Upload and manage notes, PDFs, videos, and study material.",
  },
  {
    slug: "payments",
    label: "Payment Details",
    icon: "ti-credit-card",
    description: "Track fees, invoices, dues, and payment history.",
  },
  {
    slug: "courses",
    label: "Course Management",
    icon: "ti-notebook",
    description: "Structure the syllabus into courses, chapters, and lessons.",
  },
  {
    slug: "tests",
    label: "Tests & Quiz",
    icon: "ti-clipboard-check",
    description: "Create, schedule, and grade tests and quizzes.",
  },
  {
    slug: "mock-exams",
    label: "Mock Exams",
    icon: "ti-certificate",
    description: "Schedule and manage full CAIE-style mock examinations.",
  },
];

export function getAdminSection(slug: string): AdminSection | undefined {
  return adminSections.find((s) => s.slug === slug);
}
