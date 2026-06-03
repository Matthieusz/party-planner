import { CalendarDays, ChefHat, Users } from "lucide-react";

const features = [
  {
    description:
      "Guest lists, seating charts, timelines, and vendor coordination in one view. Never lose track of a detail again.",
    icon: CalendarDays,
    title: "Party Planning",
  },
  {
    description:
      "Prep schedules, menu planning, inventory tracking, and dietary compliance. Keep the back of house running smooth.",
    icon: ChefHat,
    title: "Kitchen Management",
  },
  {
    description:
      "Staff assignments, service timing, real-time status, and seamless handoffs. Everyone knows their role.",
    icon: Users,
    title: "Service Coordination",
  },
] as const;

export default function Features() {
  return (
    <section id="features" className="py-20 lg:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-medium">
            Everything your venue needs
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Three pillars, one seamless workflow. From first guest to final
            service.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
