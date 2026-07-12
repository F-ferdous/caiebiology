import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Batches from "@/components/Batches";

export const metadata: Metadata = {
  title: "All Batches — CAIE-BIOLOGY",
  description:
    "Browse every open CAIE-BIOLOGY batch — class, schedule, location, seats and class type — and enrol in the one that fits you.",
};

export default function BatchesPage() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <Batches showAll />
      </main>
      <Footer />
    </>
  );
}
