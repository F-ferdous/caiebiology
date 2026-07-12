import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Features from "@/components/Features";
import AISection from "@/components/AISection";
import AppPreview from "@/components/AppPreview";
import CTASection from "@/components/CTASection";

export const metadata: Metadata = {
  title: "Features — CAIE-BIOLOGY",
  description:
    "Everything CAIE-BIOLOGY offers — curated resources, live classes, AI tutoring, progress tracking and more, built for CAIE students.",
};

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      {/* Offset the fixed 84px navbar */}
      <main id="main-content" style={{ paddingTop: 84 }}>
        <Features />
        <AISection />
        <AppPreview />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
