"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { clearParentSession, getParentSession, type ParentKind } from "@/lib/parentAuth";
import PanelShell, { type PanelNavItem } from "../admin/PanelShell";
import { StudentContext } from "../student/studentContext";
import { type StudentRecord } from "../student/studentData";

const navItems: PanelNavItem[] = [
  { href: "/parent", label: "Dashboard", icon: "ti-layout-dashboard" },
  { href: "/parent/notices", label: "Notices", icon: "ti-speakerphone" },
  { href: "/parent/profile", label: "Child's Profile", icon: "ti-user-circle" },
  { href: "/parent/tests", label: "Tests & Quizzes", icon: "ti-clipboard-check" },
  { href: "/parent/payments", label: "Payment Info", icon: "ti-credit-card" },
  { href: "/parent/resources", label: "Resources", icon: "ti-books" },
];

// Which parent signed in — exposed so the dashboard can greet them.
const ParentKindContext = createContext<ParentKind>("guardian");
export function useParentKind(): ParentKind {
  return useContext(ParentKindContext);
}

export default function ParentShell({ children }: { children: React.ReactNode }) {
  const [child, setChild] = useState<StudentRecord | null>(null);
  // Which parent signed in — read once from the session (no effect setState).
  const [parent] = useState<ParentKind>(() => getParentSession()?.parent ?? "guardian");
  const router = useRouter();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      router.replace("/parent/login");
      return;
    }
    const session = getParentSession();
    if (!session) {
      router.replace("/parent/login");
      return;
    }
    // Live-follow the child's record by its doc id.
    const unsub = onSnapshot(
      doc(getFirebaseDb(), "Students", session.childId),
      (snap) => {
        if (!snap.exists()) {
          // Child record deleted (or a stale session) — sign out.
          clearParentSession();
          setChild(null);
          router.replace("/parent/login");
          return;
        }
        setChild({ id: snap.id, ...(snap.data() as Omit<StudentRecord, "id">) });
      },
      () => router.replace("/parent/login")
    );
    return unsub;
  }, [router]);

  const handleLogout = () => {
    clearParentSession();
    router.replace("/parent/login");
  };

  if (!child) return null;

  return (
    <ParentKindContext.Provider value={parent}>
      <StudentContext.Provider value={child}>
        <PanelShell
          homeHref="/parent"
          navItems={navItems}
          badgeLabel="Parent"
          avatarInitial={(child.name[0] ?? "P").toUpperCase()}
          sectionsLabel="My Child"
          onLogout={handleLogout}
        >
          {children}
        </PanelShell>
      </StudentContext.Provider>
    </ParentKindContext.Provider>
  );
}
