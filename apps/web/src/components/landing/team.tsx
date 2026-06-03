const placeholders = [
  { name: "Alex Rivera", role: "Founder & CEO" },
  { name: "Jordan Chen", role: "Head of Product" },
  { name: "Morgan Park", role: "Lead Engineer" },
  { name: "Casey Blake", role: "Design Lead" },
] as const;

export default function Team() {
  return (
    <section id="team" className="py-20 lg:py-28 bg-muted">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-medium">
            Built for hospitality
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We are a team of event professionals and engineers who believe venue
            operations deserve better tools.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {placeholders.map(({ name, role }) => (
            <div key={name} className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-4" />
              <div className="font-medium">{name}</div>
              <div className="text-sm text-muted-foreground">{role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
