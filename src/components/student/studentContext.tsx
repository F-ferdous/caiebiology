"use client";

import { createContext, useContext } from "react";
import { type StudentRecord } from "./studentData";

// The signed-in student's live record. Shared so both the student portal
// (StudentShell) and the parent portal (ParentShell) can provide it — the
// read-only student sections (Notices, Resources, Tests, Payments) consume it
// via useStudent() and work unchanged in either portal.
export const StudentContext = createContext<StudentRecord | null>(null);

export function useStudent(): StudentRecord {
  const student = useContext(StudentContext);
  if (!student) throw new Error("useStudent must be used within a Student or Parent shell");
  return student;
}
