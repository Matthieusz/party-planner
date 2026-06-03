import { Button } from "@party-planner/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@party-planner/ui/components/card";
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

const freeFeatures = [
  "Up to 3 active events",
  "Guest list management",
  "Basic kitchen prep tracking",
  "Service timing tools",
  "Email support",
] as const;

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 lg:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-medium">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free. Scale when you are ready.
          </p>
        </div>

        <div className="max-w-sm mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Free</CardTitle>
              <CardDescription>
                For small venues getting started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <span className="text-4xl font-medium">$0</span>
                <span className="text-muted-foreground text-base font-normal">
                  /month
                </span>
              </div>
              <ul className="space-y-3">
                {freeFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link to="/login">
                <Button className="w-full">Get started</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
