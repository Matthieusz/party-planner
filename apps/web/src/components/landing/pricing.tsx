import { Button } from "@party-planner/ui/components/button";
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

const freeFeatures = [
  "Up to 3 active events",
  "Guest list management",
  "Basic kitchen prep tracking",
  "Service timing tools",
  "Email support",
] as const;

export default function Pricing() {
  return (
    <section id="pricing" className="border-t border-border py-20 lg:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="max-w-2xl">
          <h2 className="text-balance text-3xl font-semibold tracking-tight lg:text-4xl">
            Start free. Scale when service demands it.
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            No seat minimums, no setup fees, no training required. If you can
            run a pass, you can run Party Planner.
          </p>
        </div>

        <div className="mt-12 grid max-w-4xl overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="flex flex-col justify-between gap-8 border-b border-dashed border-border p-6 sm:border-b-0 sm:border-r sm:p-8">
            <div>
              <p className="text-sm font-semibold">Free</p>
              <p className="mt-1 text-sm text-muted-foreground">
                For small venues getting their first events on the books.
              </p>
              <p className="mt-6">
                <span className="font-mono text-5xl font-medium tracking-tight">
                  $0
                </span>
                <span className="ml-1 text-sm text-muted-foreground">
                  /month
                </span>
              </p>
            </div>
            <Link to="/login">
              <Button className="min-h-11 w-full">Get started</Button>
            </Link>
          </div>

          <div className="p-6 sm:p-8">
            <p className="text-xs font-medium text-muted-foreground">
              Everything included:
            </p>
            <ul className="mt-4 space-y-3.5">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Check className="size-3" strokeWidth={3} aria-hidden />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
