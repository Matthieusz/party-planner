import { Button } from "@party-planner/ui/components/button";
import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Check } from "lucide-react";

const enter =
  "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:fill-mode-both";

type Status = "complete" | "on-track" | "attention";

const StatusIcon = ({ status }: { status: Status }) => {
  if (status === "complete") {
    return (
      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary-foreground/10 text-primary-foreground/70">
        <Check className="size-3" strokeWidth={3} />
      </span>
    );
  }
  if (status === "attention") {
    return (
      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-destructive/25 text-primary-foreground">
        <AlertCircle className="size-3" strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ring-2 ring-primary-foreground/25">
      <span className="size-1.5 rounded-full bg-primary-foreground motion-safe:animate-pulse" />
    </span>
  );
};

const rows: { status: Status; title: string; state: string; detail: string }[] =
  [
    {
      detail: "Marta · confirmed 4:12 PM",
      state: "Done",
      status: "complete",
      title: "Final guest count",
    },
    {
      detail: "Chef Liu · 6 of 8 courses plated",
      state: "On track",
      status: "on-track",
      title: "Kitchen prep",
    },
    {
      detail: "Needs confirmation by 5:30",
      state: "Action needed",
      status: "attention",
      title: "Floor staff briefing",
    },
  ];

const timeline: { time: string; label: string; state: Status }[] = [
  { label: "Setup", state: "complete", time: "5:30" },
  { label: "Doors", state: "complete", time: "6:45" },
  { label: "Service", state: "on-track", time: "7:00" },
  { label: "Clear", state: "attention", time: "9:30" },
];

const timelineDot: Record<Status, string> = {
  attention: "bg-destructive",
  complete: "bg-primary-foreground/50",
  "on-track": "bg-primary-foreground",
};

const EventBoard = () => (
  <div className="relative mx-auto w-full max-w-md">
    {/* Soft offset shadow, no border — avoids the ghost-card pairing */}
    <div
      aria-hidden
      className="absolute -inset-3 -z-10 rounded-[20px] bg-primary/10 blur-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:duration-1000 motion-safe:delay-300"
    />
    <div className="overflow-hidden rounded-xl bg-primary p-5 text-primary-foreground ring-1 ring-primary-foreground/10 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-primary-foreground/85">
          <span className="size-2 rounded-full bg-primary-foreground motion-safe:animate-pulse" />
          Live
        </span>
        <span className="text-[11px] tabular-nums text-primary-foreground/55">
          EVENT&nbsp;#4821
        </span>
      </div>
      <div className="mt-3">
        <h3 className="font-heading text-lg font-medium">
          Grand Ballroom · Tonight
        </h3>
        <p className="mt-0.5 text-xs text-primary-foreground/60">
          7:00 PM &middot; 180 guests &middot; 3 staff leads
        </p>
      </div>

      {/* Status rows */}
      <ul className="mt-4">
        {rows.map((row) => (
          <li
            key={row.title}
            className="flex items-start gap-3 border-t border-primary-foreground/10 py-3 first:border-t-0"
          >
            <StatusIcon status={row.status} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium">
                  {row.title}
                </span>
                <span className="shrink-0 text-[11px] text-primary-foreground/55">
                  {row.state}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-primary-foreground/55">
                {row.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* Timeline */}
      <div className="mt-4 border-t border-primary-foreground/10 pt-4">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-primary-foreground/50">
          Timeline
        </div>
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-x-1 top-1.5 h-px bg-primary-foreground/20"
          />
          <ol className="relative flex justify-between">
            {timeline.map((m) => (
              <li key={m.time} className="flex flex-col items-center gap-2">
                <span
                  className={[
                    "size-3 rounded-full ring-2 ring-primary",
                    timelineDot[m.state],
                  ].join(" ")}
                />
                <div className="text-center">
                  <div className="text-[10px] font-medium tabular-nums text-primary-foreground/90">
                    {m.time}
                  </div>
                  <div className="text-[10px] text-primary-foreground/55">
                    {m.label}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  </div>
);

const Hero = () => (
  <section className="relative overflow-hidden">
    <div className="container mx-auto max-w-6xl px-4 pt-24 pb-24 lg:pt-32 lg:pb-32">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className={enter}>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary motion-safe:animate-pulse" />
            The operational hub for hotels &amp; venues
          </span>

          <h1 className="mt-5 text-balance font-heading text-4xl font-medium leading-[1.05] sm:text-5xl lg:text-6xl">
            Plan parties, manage kitchens, coordinate service —{" "}
            <span className="text-primary">all in one place.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Replace fragmented spreadsheets, paper checklists, and walkie-talkie
            chaos with a single operational hub built for hotels and venues.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link to="/login" className="sm:w-auto">
              <Button size="lg" className="min-h-11 w-full gap-2 sm:w-auto">
                Get started free
                <ArrowRight className="h-4 w-4" />
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

        <div className={`${enter} motion-safe:delay-150`}>
          <EventBoard />
        </div>
      </div>
    </div>
  </section>
);

export default Hero;
