"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_SESSION_KEY } from "@/lib/adminAuth";
import { adminSections } from "@/lib/adminNav";
import PanelShell, { type PanelNavItem } from "./PanelShell";

const navItems: PanelNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "ti-layout-dashboard" },
  ...adminSections.map((s) => ({
    href: `/admin/${s.slug}`,
    label: s.label,
    icon: s.icon,
  })),
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (sessionStorage.getItem(ADMIN_SESSION_KEY) !== "1") {
      router.replace("/admin/login");
    } else {
      setAuthed(true);
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    router.replace("/admin/login");
  };

  if (!authed) return null;

  return (
    <PanelShell
      homeHref="/admin"
      navItems={navItems}
      badgeLabel="Admin"
      avatarInitial="A"
      onLogout={handleLogout}
    >
      {children}
    </PanelShell>
  );
}
