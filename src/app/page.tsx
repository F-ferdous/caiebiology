import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Instructor from "@/components/Instructor";
import Batches from "@/components/Batches";
import AISection from "@/components/AISection";
import ParentsCorner from "@/components/ParentsCorner";
import International from "@/components/International";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <Hero />
        <Features />
        <Instructor />
        <Batches />
        <AISection />
        <ParentsCorner />
        <International />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
