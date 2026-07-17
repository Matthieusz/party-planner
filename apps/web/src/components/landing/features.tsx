import { CalendarDays, ChefHat, Users } from "lucide-react";

const features = [
  {
    description:
      "Guest lists, seating charts, timelines, and vendor coordination in one view. Every detail has exactly one home, and everyone sees the same version.",
    icon: CalendarDays,
    title: "Party planning",
  },
  {
    description:
      "Prep schedules, menu planning, inventory tracking, and dietary compliance. The back of house stays ahead of the dining room, course by course.",
    icon: ChefHat,
    title: "Kitchen management",
  },
  {
    description:
      "Staff assignments, service timing, real-time status, and clean handoffs between shifts. Everyone on the floor knows their role and what happens next.",
    icon: Users,
    title: "Service coordination",
  },
] as const;

export default function Features() {
  return (
    <section id="features" className="border-t border-border py-20 lg:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <div>
            <h2 className="text-balance text-3xl font-semibold tracking-tight lg:text-4xl">
              Built for the three rooms of every event
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
              Planning, kitchen, and service run on different clocks but one
              truth. Party Planner keeps all three in step from first booking to
              final clear.
            </p>
          </div>

          <ul className="divide-y divide-border border-y border-border">
            {features.map(({ icon: Icon, title, description }) => (
              <li
                key={title}
                className="flex gap-5 py-6 first:pt-0 last:pb-0 sm:py-7 sm:first:pt-0"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" strokeWidth={2} aria-hidden />
                </span>
                <div>
                  <h3 className="text-base font-semibold">{title}</h3>
                  <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
