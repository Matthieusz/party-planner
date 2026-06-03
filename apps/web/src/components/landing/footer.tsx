export default function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="font-heading font-medium text-lg mb-2">
              Party Planner
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              The operational hub for hotels and venues that run on precision,
              not panic.
            </p>
          </div>
          <div>
            <div className="font-medium mb-3">Product</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="#features"
                  className="hover:text-foreground transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="hover:text-foreground transition-colors"
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-3">Company</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="#team"
                  className="hover:text-foreground transition-colors"
                >
                  Team
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@partyplanner.app"
                  className="hover:text-foreground transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border text-sm text-muted-foreground">
          © 2026 Party Planner. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
