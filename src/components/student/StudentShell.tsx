"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { clearStudentSession, getStudentSession } from "@/lib/studentAuth";
import PanelShell, { type PanelNavItem } from "../admin/PanelShell";
import { type StudentRecord } from "./studentData";

const navItems: PanelNavItem[] = [
  { href: "/student", label: "Dashboard", icon: "ti-layout-dashboard" },
  { href: "/student/profile", label: "Profile", icon: "ti-user-circle" },
  { href: "/student/resources", label: "Resources", icon: "ti-books" },
  { href: "/student/tests", label: "Tests & Quizzes", icon: "ti-clipboard-check" },
  { href: "/student/payments", label: "Payment Info", icon: "ti-credit-card" },
];

const StudentContext = createContext<StudentRecord | null>(null);

export function useStudent(): StudentRecord {
  const student = useContext(StudentContext);
  if (!student) throw new Error("useStudent must be used within StudentShell");
  return student;
}

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
