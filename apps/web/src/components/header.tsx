import { Button } from "@party-planner/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@party-planner/ui/components/sheet";
import { Link, useLocation } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";

import UserMenu from "./user-menu";

const landingLinks = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#team", label: "Team" },
] as const;

const appLinks = [
  { label: "Home", to: "/" },
  { label: "Dashboard", to: "/dashboard" },
] as const;

export default function Header() {
  const { pathname } = useLocation();
  const isLanding = pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto max-w-6xl flex items-center justify-between h-14 px-4">
        <Link to="/" className="font-heading font-medium text-lg">
          Party Planner
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {isLanding ? (
            <>
              {landingLinks.map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  className="inline-flex items-center h-9 px-3 rounded-4xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  {label}
                </a>
              ))}
              <Link to="/login" className="ml-2">
                <Button>Get started</Button>
              </Link>
            </>
          ) : (
            <>
              {appLinks.map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  className="inline-flex items-center h-9 px-3 rounded-4xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  {label}
                </Link>
              ))}
              <div className="ml-2">
                <UserMenu />
              </div>
            </>
          )}
        </nav>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-4xl hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="sr-only">Navigation menu</SheetTitle>
            <nav className="flex flex-col gap-2 mt-8">
              {isLanding ? (
                <>
                  {landingLinks.map(({ label, href }) => (
                    <a
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex items-center h-10 px-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      {label}
                    </a>
                  ))}
                  <div className="mt-4 pt-4 border-t border-border">
                    <Link to="/login" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full">Get started</Button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  {appLinks.map(({ label, to }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex items-center h-10 px-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                  <div className="mt-4 pt-4 border-t border-border">
                    <UserMenu />
                  </div>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
