"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  ASSISTANT_EMAIL_DOMAIN,
  getFirebaseAuth,
  isFirebaseConfigured,
} from "@/lib/firebase";
import { adminSections } from "@/lib/adminNav";
import PanelShell, { type PanelNavItem } from "../admin/PanelShell";

const navItems: PanelNavItem[] = [
  { href: "/assistant", label: "Dashboard", icon: "ti-layout-dashboard" },
  ...adminSections
    .filter((s) => s.slug !== "assistants")
    .map((s) => ({
      href: `/assistant/${s.slug}`,
      label: s.label,
      icon: s.icon,
    })),
];

export default function AssistantShell({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      router.replace("/assistant/login");
      return;
    }
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (user) => {
      if (user?.email?.endsWith(`@${ASSISTANT_EMAIL_DOMAIN}`)) {
        setUsername(user.email.split("@")[0]);
      } else {
        router.replace("/assistant/login");
      }
    });
    return unsubscribe;
  }, [router]);

  const handleLogout = async () => {
    await signOut(getFirebaseAuth());
    router.replace("/assistant/login");
  };

  if (!username) return null;

  return (
    <PanelShell
      homeHref="/assistant"
      navItems={navItems}
      badgeLabel="Assistant"
      avatarInitial={username[0].toUpperCase()}
      onLogout={handleLogout}
    >
      {children}
    </PanelShell>
  );
}
