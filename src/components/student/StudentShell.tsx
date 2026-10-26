"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { clearStudentSession, getStudentSession } from "@/lib/studentAuth";
import { getParentSession } from "@/lib/parentAuth";
import { disablePush } from "@/lib/push";
import PanelShell, { type PanelNavItem } from "../admin/PanelShell";
import { type StudentRecord } from "./studentData";
import { StudentContext, useStudent } from "./studentContext";

// Re-exported so existing imports (`import { useStudent } from "./StudentShell"`)
// keep working now that the context lives in its own module.
export { useStudent };

const navItems: PanelNavItem[] = [
  { href: "/student", label: "Dashboard", icon: "ti-layout-dashboard" },
  { href: "/student/notices", label: "Notices", icon: "ti-speakerphone" },
  { href: "/student/profile", label: "Profile", icon: "ti-user-circle" },
  { href: "/student/resources", label: "Resources", icon: "ti-books" },
  { href: "/student/tutor", label: "AI Tutor", icon: "ti-sparkles" },
  { href: "/student/tests", label: "Tests & Quizzes", icon: "ti-clipboard-check" },
  { href: "/student/payments", label: "Payment Info", icon: "ti-credit-card" },
];

export default function StudentShell({ children }: { children: React.ReactNode }) {
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      router.replace("/login");
      return;
    }
    const id = getStudentSession();
    if (!id) {
      // A parent who tapped a push notification lands on a /student/* URL —
      // send them to the matching page in their own portal instead of /login.
      if (getParentSession()) {
        const path = typeof window !== "undefined" ? window.location.pathname : "";
        const dest = path.includes("/tests")
          ? "/parent/tests"
          : path.includes("/payments")
            ? "/parent/payments"
            : "/parent";
        router.replace(dest);
        return;
      }
      router.replace("/login");
      return;
    }
    // Live-follow the signed-in student's own record by its doc id.
    const unsub = onSnapshot(
      doc(getFirebaseDb(), "Students", id),
      (snap) => {
        if (!snap.exists()) {
          // Record deleted (or a stale session) — sign out
          clearStudentSession();
          setStudent(null);
          router.replace("/login");
          return;
        }
        setStudent({ id: snap.id, ...(snap.data() as Omit<StudentRecord, "id">) });
      },
      () => router.replace("/login")
    );
    return unsub;
  }, [router]);

  const handleLogout = () => {
    // Forget this device's push token so a shared device stops getting the
    // student's notices after they sign out.
    void disablePush();
    clearStudentSession();
    router.replace("/login");
  };

  if (!student) return null;

  return (
    <StudentContext.Provider value={student}>
      <PanelShell
        homeHref="/student"
        navItems={navItems}
        badgeLabel="Student"
        avatarInitial={(student.name[0] ?? "S").toUpperCase()}
        sectionsLabel="My Portal"
        onLogout={handleLogout}
      >
        {children}
      </PanelShell>
    </StudentContext.Provider>
  );
}
