import { Button } from "@party-planner/ui/components/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export default function CtaBanner() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container mx-auto max-w-4xl px-4 text-center">
        <h2 className="font-heading text-3xl lg:text-4xl font-medium mb-4">
          Ready to streamline your events?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
          Join venues already using Party Planner to run smoother events with
          less chaos.
        </p>
        <Link to="/login">
          <Button size="lg" className="min-h-11 gap-2">
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
