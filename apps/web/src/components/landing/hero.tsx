import { Button } from "@party-planner/ui/components/button";
import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowRight } from "lucide-react";

const enter =
  "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:fill-mode-both";

type Status = "done" | "live" | "next";

const milestones: { time: string; label: string; status: Status }[] = [
  { label: "Setup", status: "done", time: "17:30" },
  { label: "Doors", status: "done", time: "18:45" },
  { label: "First service", status: "live", time: "19:00" },
  { label: "Mains", status: "next", time: "20:15" },
  { label: "Clear & reset", status: "next", time: "21:30" },
];

const statusLabel: Record<Status, string> = {
  done: "Done",
  live: "Now",
  next: "Next",
};

const statusTextClass: Record<Status, string> = {
  done: "mt-1.5 text-[11px] text-muted-foreground",
  live: "mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-primary",
  next: "mt-1.5 text-[11px] text-muted-foreground/70",
};

/**
 * A "service pass" ticket: tonight's run of show rendered as a kitchen chit,
 * with mono times and unambiguous status. This is the product's voice.
 */
const ServicePass = () => (
  <div
    className={`${enter} motion-safe:delay-200 relative mt-16 overflow-hidden rounded-xl border border-border bg-card shadow-sm`}
  >
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-border px-5 py-3.5 sm:px-6">
      <p className="font-mono text-xs font-medium tracking-wide text-foreground">
        GRAND BALLROOM <span className="text-muted-foreground">· #4821</span>
      </p>
      <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <span
          aria-hidden
          className="size-1.5 rounded-full bg-primary motion-safe:animate-pulse"
        />
        Live · 180 guests
      </p>
    </div>

    <ol className="grid grid-cols-2 divide-border sm:grid-cols-5 sm:divide-x sm:divide-dashed">
      {milestones.map((milestone) => (
        <li
          key={milestone.time}
          className="border-b border-dashed border-border px-5 py-4 last:border-b-0 sm:border-b-0 sm:px-6 sm:py-5"
        >
          <p className="font-mono text-lg font-medium tabular-nums tracking-tight">
            {milestone.time}
          </p>
          <p className="mt-1 text-xs font-medium">{milestone.label}</p>
          <p className={statusTextClass[milestone.status]}>
            {milestone.status === "live" && (
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-primary motion-safe:animate-pulse"
              />
            )}
            {statusLabel[milestone.status]}
          </p>
        </li>
      ))}
    </ol>

    <div className="flex items-center gap-2.5 border-t border-dashed border-border bg-destructive/5 px-5 py-3 sm:px-6">
      <AlertCircle className="size-3.5 shrink-0 text-destructive" aria-hidden />
      <p className="text-xs font-medium text-foreground">
        Floor staff briefing needs confirmation by 17:30
      </p>
    </div>
  </div>
);

const Hero = () => (
  <section className="relative overflow-hidden">
    <div className="container mx-auto max-w-6xl px-4 pt-20 pb-20 sm:pt-24 lg:pt-28 lg:pb-28">
      <div className="max-w-3xl">
        <h1
          className={`${enter} text-balance text-4xl font-semibold leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl`}
        >
          One pass for the whole floor.
        </h1>
        <p
          className={`${enter} motion-safe:delay-100 mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground`}
        >
          Guest lists, kitchen prep, and service timing in a single operational
          hub, so coordinators, chefs, and floor staff work from the same truth.
          No spreadsheets, no walkie-talkie chaos.
        </p>
        <div
          className={`${enter} motion-safe:delay-150 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center`}
        >
          <Link to="/login" className="sm:w-auto">
            <Button size="lg" className="min-h-11 w-full gap-2 sm:w-auto">
              Get started free
              <ArrowRight aria-hidden />
            </Button>
          </Link>
          <a href="#features" className="sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="min-h-11 w-full sm:w-auto"
            >
              See how it works
            </Button>
          </a>
        </div>
      </div>

      <ServicePass />
    </div>
  </section>
);

export default Hero;
