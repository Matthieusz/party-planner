import { createFileRoute } from "@tanstack/react-router";
import { ConciergeBell } from "lucide-react";
import { useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

const serviceStrip = [
  { label: "Setup complete", state: "done", time: "17:30" },
  { label: "Doors open", state: "done", time: "18:45" },
  { label: "First service", state: "live", time: "19:00" },
  { label: "Clear and reset", state: "next", time: "21:30" },
] as const;

type StripState = (typeof serviceStrip)[number]["state"];

const stripDotClass: Record<StripState, string> = {
  done: "size-1.5 rounded-full bg-primary-foreground/45",
  live: "size-1.5 rounded-full bg-primary-foreground motion-safe:animate-pulse",
  next: "size-1.5 rounded-full ring-1 ring-primary-foreground/40",
};

const BrandPanel = () => (
  <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex xl:p-14">
    <div className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-lg bg-primary-foreground/12">
        <ConciergeBell className="size-4.5" strokeWidth={2.25} aria-hidden />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">
        Party Planner
      </span>
    </div>

    <div className="max-w-md">
      <p className="font-mono text-xs text-primary-foreground/60">
        Grand Ballroom · Event #4821
      </p>
      <p className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
        The calm in the chaos of service.
      </p>
      <p className="mt-4 text-[15px] leading-relaxed text-primary-foreground/75">
        Guest lists, kitchen prep, and service timing in one operational hub, so
        your team always knows what happens next.
      </p>

      <ul className="mt-10 space-y-0 border-t border-primary-foreground/15">
        {serviceStrip.map((item) => (
          <li
            key={item.time}
            className="flex items-center gap-4 border-b border-primary-foreground/15 py-3 font-mono text-xs"
          >
            <span className="w-11 tabular-nums text-primary-foreground/80">
              {item.time}
            </span>
            <span aria-hidden className={stripDotClass[item.state]} />
            <span className="text-primary-foreground/85">{item.label}</span>
            {item.state === "live" && (
              <span className="ml-auto text-[10px] uppercase tracking-wider text-primary-foreground/60">
                Now
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>

    <p className="font-mono text-[11px] text-primary-foreground/50">
      Trusted on the floor, from setup to clear.
    </p>
  </div>
);

const RouteComponent = () => {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <div className="grid h-full lg:grid-cols-2">
      <BrandPanel />
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        {showSignIn ? (
          <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
        ) : (
          <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
        )}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});
