import { createFileRoute } from "@tanstack/react-router";

import CtaBanner from "@/components/landing/cta-banner";
import Features from "@/components/landing/features";
import Footer from "@/components/landing/footer";
import Hero from "@/components/landing/hero";
import Pricing from "@/components/landing/pricing";
import Team from "@/components/landing/team";
import Testimonial from "@/components/landing/testimonial";

const LandingPage = () => (
  <div className="flex flex-col">
    <Hero />
    <Features />
    <Testimonial />
    <Pricing />
    <Team />
    <CtaBanner />
    <Footer />
  </div>
);

export const Route = createFileRoute("/")({
  component: LandingPage,
});
