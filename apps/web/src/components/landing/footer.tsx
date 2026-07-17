import { ConciergeBell } from "lucide-react";

const productLinks = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
] as const;

const companyLinks = [
  { href: "#team", label: "Team" },
  { href: "mailto:hello@partyplanner.app", label: "Contact" },
] as const;

export default function Footer() {
  return (
    <footer className="border-t border-border py-14">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                <ConciergeBell
                  className="size-4"
                  strokeWidth={2.25}
                  aria-hidden
                />
              </span>
              <span className="text-[15px] font-semibold tracking-tight">
                Party Planner
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The operational hub for hotels and venues that run on precision,
              not panic.
            </p>
          </div>

          <nav aria-label="Product">
            <h3 className="text-sm font-semibold">Product</h3>
            <ul className="mt-4 space-y-2.5">
              {productLinks.map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company">
            <h3 className="text-sm font-semibold">Company</h3>
            <ul className="mt-4 space-y-2.5">
              {companyLinks.map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-8 text-sm text-muted-foreground">
          <p>© 2026 Party Planner. All rights reserved.</p>
          <p className="font-mono text-xs">Made for the floor.</p>
        </div>
      </div>
    </footer>
  );
}
