import { Quote } from "lucide-react";

export default function Testimonial() {
  return (
    <section className="py-20 lg:py-28 bg-muted">
      <div className="container mx-auto max-w-4xl px-4 text-center">
        <Quote className="h-8 w-8 text-primary/40 mx-auto mb-6" />
        <blockquote className="font-heading text-2xl lg:text-3xl font-medium leading-relaxed mb-8">
          "Party Planner turned our chaotic event coordination into a smooth,
          repeatable process. We now run banquets with half the stress and none
          of the missed details."
        </blockquote>
        <div className="flex items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 shrink-0" />
          <div className="text-left">
            <div className="font-medium">Sarah Mitchell</div>
            <div className="text-sm text-muted-foreground">
              Banquet Manager, The Grand Hotel
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
