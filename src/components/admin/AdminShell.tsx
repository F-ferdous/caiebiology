"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { isAdminEmail } from "@/lib/adminAuth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
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
    if (!isFirebaseConfigured) {
      router.replace("/admin/login");
      return;
    }
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (user) => {
      if (isAdminEmail(user?.email)) {
        setAuthed(true);
      } else {
        router.replace("/admin/login");
      }
    });
    return unsubscribe;
  }, [router]);

  const handleLogout = async () => {
    await signOut(getFirebaseAuth());
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
