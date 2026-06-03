import { Button } from "@party-planner/ui/components/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

const shapeEnter =
  "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-1000 motion-safe:fill-mode-both motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]";

const HeroVisual = () => (
  <div className="relative aspect-square max-w-md mx-auto" aria-hidden="true">
    <div
      className={`absolute inset-[5%] rounded-4xl bg-primary/[0.06] ${shapeEnter} motion-safe:delay-100`}
    />
    <div
      className={`absolute top-[15%] left-[10%] right-[20%] bottom-[25%] rounded-4xl bg-foreground/[0.03] ${shapeEnter} motion-safe:delay-200`}
    />
    <div
      className={`absolute top-[30%] right-[15%] w-[35%] h-[20%] rounded-4xl bg-primary/[0.1] ${shapeEnter} motion-safe:delay-300`}
    />
    <div
      className={`absolute bottom-[20%] left-[20%] w-[25%] h-[15%] rounded-3xl bg-foreground/[0.05] ${shapeEnter} motion-safe:delay-400`}
    />
    <div
      className={`absolute top-[10%] right-[20%] w-[20%] h-[12%] rounded-3xl bg-primary/[0.08] ${shapeEnter} motion-safe:delay-500`}
    />
  </div>
);

const textEnter =
  "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:fill-mode-both";

const visualEnter =
  "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-1000 motion-safe:delay-200 motion-safe:fill-mode-both motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]";

const Hero = () => (
  <section className="relative overflow-hidden bg-primary/[0.06] pt-20 pb-24 lg:pt-28 lg:pb-32">
    <div className="container mx-auto max-w-6xl px-4">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="space-y-8">
          <h1
            className={`font-heading text-4xl lg:text-5xl font-medium leading-[1.1] text-foreground ${textEnter}`}
          >
            Plan parties, manage kitchens, coordinate service — all in one
            place.
          </h1>
          <p
            className={`text-lg text-muted-foreground max-w-lg leading-relaxed ${textEnter} motion-safe:delay-150`}
          >
            Replace fragmented spreadsheets, paper checklists, and walkie-talkie
            chaos with a single operational hub built for hotels and venues.
          </p>
          <div
            className={`flex flex-wrap gap-3 ${textEnter} motion-safe:delay-300`}
          >
            <Link to="/login">
              <Button size="lg" className="min-h-11 gap-2">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="min-h-11">
                See how it works
              </Button>
            </a>
          </div>
        </div>

        <div className={`hidden lg:block ${visualEnter}`}>
          <HeroVisual />
        </div>
      </div>
    </div>
  </section>
);

export default Hero;
