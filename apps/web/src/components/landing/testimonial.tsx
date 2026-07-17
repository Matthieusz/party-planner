import { Avatar, AvatarFallback } from "@party-planner/ui/components/avatar";

export default function Testimonial() {
  return (
    <section className="border-t border-border bg-muted/50 py-20 lg:py-28">
      <div className="container mx-auto max-w-4xl px-4">
        <figure>
          <blockquote className="text-balance text-2xl font-medium leading-snug tracking-tight lg:text-3xl">
            &ldquo;Party Planner turned our chaotic event coordination into a
            calm, repeatable service. We run banquets with half the stress and
            none of the missed details.&rdquo;
          </blockquote>
          <figcaption className="mt-8 flex items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                SM
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-semibold">Sarah Mitchell</div>
              <div className="font-mono text-xs text-muted-foreground">
                Banquet Manager · The Grand Hotel
              </div>
            </div>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
