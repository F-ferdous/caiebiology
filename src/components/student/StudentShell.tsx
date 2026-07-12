"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import {
  ASSISTANT_EMAIL_DOMAIN,
  getFirebaseAuth,
  getFirebaseDb,
  isFirebaseConfigured,
} from "@/lib/firebase";
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
    let unsubStudent: (() => void) | undefined;
    const unsubAuth = onAuthStateChanged(getFirebaseAuth(), (user) => {
      unsubStudent?.();
      unsubStudent = undefined;

      // Assistants sign in with synthetic emails — they belong in /assistant
      if (!user?.email || user.email.endsWith(`@${ASSISTANT_EMAIL_DOMAIN}`)) {
        setStudent(null);
        router.replace("/login");
        return;
      }

      const q = query(
        collection(getFirebaseDb(), "Students"),
        where("uid", "==", user.uid)
      );
      unsubStudent = onSnapshot(q, (snap) => {
        if (snap.empty) {
          // Authenticated but not enrolled — no student record to show
          signOut(getFirebaseAuth());
          setStudent(null);
          router.replace("/login");
          return;
        }
        const d = snap.docs[0];
        setStudent({ id: d.id, ...(d.data() as Omit<StudentRecord, "id">) });
      });
    });
    return () => {
      unsubStudent?.();
      unsubAuth();
    };
  }, [router]);

  const handleLogout = async () => {
    await signOut(getFirebaseAuth());
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
