import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign In — CAIE-BIOLOGY",
  description:
    "Sign in to CAIE-BIOLOGY to access your resources, live classes, and AI-powered biology tutoring.",
};

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <AuthForm mode="login" />
      </main>
      <Footer />
    </>
  );
}
