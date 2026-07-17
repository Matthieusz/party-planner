import { Button } from "@party-planner/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@party-planner/ui/components/sheet";
import { cn } from "@party-planner/ui/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import { ConciergeBell, Menu } from "lucide-react";
import { useState } from "react";

import ThemeToggle from "./theme-toggle";
import UserMenu from "./user-menu";

const landingLinks = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#team", label: "Team" },
] as const;

const appLinks = [{ label: "Dashboard", to: "/dashboard" }] as const;

const Wordmark = () => (
  <Link
    to="/"
    aria-label="Party Planner home"
    className="flex items-center gap-2.5"
  >
    <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
      <ConciergeBell className="size-4" strokeWidth={2.25} aria-hidden />
    </span>
    <span className="text-[15px] font-semibold tracking-tight">
      Party Planner
    </span>
  </Link>
);

export default function Header() {
  const { pathname } = useLocation();
  const isLanding = pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Wordmark />

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {isLanding ? (
            <>
              {landingLinks.map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {label}
                </a>
              ))}
              <div className="ml-2 flex items-center gap-1">
                <ThemeToggle />
                <Link to="/login" className="ml-1">
                  <Button size="sm" className="h-9">
                    Get started
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              {appLinks.map(({ label, to }) => {
                const isActive = pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                      isActive && "text-primary hover:text-primary"
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
              <div className="ml-2 flex items-center gap-1">
                <ThemeToggle />
                <UserMenu />
              </div>
            </>
          )}
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className="inline-flex size-11 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
              aria-label="Open menu"
            >
              <Menu className="size-5" aria-hidden />
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <div className="mt-2">
                <Wordmark />
              </div>
              <nav aria-label="Mobile" className="mt-8 flex flex-col gap-1">
                {isLanding ? (
                  <>
                    {landingLinks.map(({ label, href }) => (
                      <a
                        key={href}
                        href={href}
                        onClick={() => setMobileOpen(false)}
                        className="inline-flex h-11 items-center rounded-lg px-3 text-[15px] font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        {label}
                      </a>
                    ))}
                    <div className="mt-6 flex flex-col gap-2 border-t border-border pt-6">
                      <Link to="/login" onClick={() => setMobileOpen(false)}>
                        <Button className="h-11 w-full">Get started</Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    {appLinks.map(({ label, to }) => {
                      const isActive = pathname.startsWith(to);
                      return (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setMobileOpen(false)}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "inline-flex h-11 items-center rounded-lg px-3 text-[15px] font-medium text-foreground transition-colors hover:bg-muted",
                            isActive && "text-primary"
                          )}
                        >
                          {label}
                        </Link>
                      );
                    })}
                    <div className="mt-6 border-t border-border pt-6">
                      <UserMenu />
                    </div>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
