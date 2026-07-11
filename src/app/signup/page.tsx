import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Create Account — CAIE-BIOLOGY",
  description:
    "Create your CAIE-BIOLOGY account as a student or teacher and start learning with curated resources, live classes, and AI tutoring.",
};

export default function SignupPage() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <AuthForm mode="signup" />
      </main>
      <Footer />
    </>
  );
}
