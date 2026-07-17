import { Button } from "@party-planner/ui/components/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export default function CtaBanner() {
  return (
    <section className="bg-primary py-20 text-primary-foreground lg:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-xs text-primary-foreground/60">
              Tonight could run calmer
            </p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight lg:text-4xl">
              Put your next event on the pass.
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-primary-foreground/75">
              Join venues already running smoother events with Party Planner.
              Free to start, live in minutes.
            </p>
          </div>
          <Link to="/login" className="shrink-0">
            <Button
              size="lg"
              className="min-h-11 w-full gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90 sm:w-auto"
            >
              Get started free
              <ArrowRight aria-hidden />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
