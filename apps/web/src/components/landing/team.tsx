import { Avatar, AvatarFallback } from "@party-planner/ui/components/avatar";

const team = [
  { initials: "AR", name: "Alex Rivera", role: "Founder & CEO" },
  { initials: "JC", name: "Jordan Chen", role: "Head of Product" },
  { initials: "MP", name: "Morgan Park", role: "Lead Engineer" },
  { initials: "CB", name: "Casey Blake", role: "Design Lead" },
] as const;

export default function Team() {
  return (
    <section
      id="team"
      className="border-t border-border bg-muted/50 py-20 lg:py-28"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="max-w-2xl">
          <h2 className="text-balance text-3xl font-semibold tracking-tight lg:text-4xl">
            Built by people who have run the floor
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            We are event professionals and engineers who believe venue
            operations deserve the same caliber of tooling as every other
            serious craft.
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
          {team.map(({ initials, name, role }) => (
            <li key={name}>
              <Avatar size="lg" className="size-14">
                <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="mt-4 text-sm font-semibold">{name}</div>
              <div className="mt-0.5 text-sm text-muted-foreground">{role}</div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
