import { Avatar, AvatarFallback } from "@party-planner/ui/components/avatar";
import { Badge } from "@party-planner/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@party-planner/ui/components/card";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { AlertCircle, Check } from "lucide-react";

import { LiveUpdates } from "@/components/live-updates";
import { SessionList } from "@/components/session-list";
import { getUser } from "@/functions/get-user";
// Representative board data until event endpoints land.
type Status = "done" | "in-progress" | "attention" | "upcoming";

interface BoardRow {
  title: string;
  owner: string;
  status: Status;
  state: string;
  detail: string;
}

const boardRows: BoardRow[] = [
  {
    detail: "Confirmed 4:12 PM",
    owner: "Marta",
    state: "Done",
    status: "done",
    title: "Final guest count",
  },
  {
    detail: "6 of 8 courses plated",
    owner: "Chef Liu",
    state: "In progress",
    status: "in-progress",
    title: "Kitchen prep",
  },
  {
    detail: "Confirm by 5:30 PM",
    owner: "Unassigned",
    state: "Action needed",
    status: "attention",
    title: "Floor staff briefing",
  },
  {
    detail: "Arrives 6:00 PM",
    owner: "Diaz Florists",
    state: "Upcoming",
    status: "upcoming",
    title: "Centerpiece delivery",
  },
];

const timeline: { time: string; label: string; status: Status }[] = [
  { label: "Setup", status: "done", time: "17:30" },
  { label: "Doors", status: "done", time: "18:45" },
  { label: "Service", status: "in-progress", time: "19:00" },
  { label: "Clear", status: "upcoming", time: "21:30" },
];

const onShift = [
  { name: "Marta Ellison", role: "Event lead" },
  { name: "Ken Liu", role: "Head chef" },
  { name: "Priya Nair", role: "Floor captain" },
  { name: "Tom Okafor", role: "Bar" },
] as const;

const getInitials = (name: string) =>
  name
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const StatusIcon = ({ status }: { status: Status }) => {
  if (status === "done") {
    return (
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
        <Check className="size-3" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  if (status === "attention") {
    return (
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-destructive/15 text-destructive">
        <AlertCircle className="size-3" strokeWidth={2.5} aria-hidden />
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span className="grid size-5 shrink-0 place-items-center rounded-full ring-2 ring-primary/30">
        <span className="size-1.5 rounded-full bg-primary motion-safe:animate-pulse" />
      </span>
    );
  }
  return (
    <span className="grid size-5 shrink-0 place-items-center rounded-full ring-2 ring-border" />
  );
};

const stateBadgeVariant: Record<
  Status,
  "secondary" | "outline" | "destructive"
> = {
  attention: "destructive",
  done: "secondary",
  "in-progress": "outline",
  upcoming: "outline",
};

const timelineDotClass: Record<Status, string> = {
  attention: "size-2.5 rounded-full bg-destructive",
  done: "size-2.5 rounded-full bg-primary",
  "in-progress": "size-2.5 rounded-full bg-primary ring-4 ring-primary/15",
  upcoming: "size-2.5 rounded-full bg-muted ring-1 ring-border",
};

const RouteComponent = () => {
  // eslint-disable-next-line no-use-before-define
  const { session } = Route.useRouteContext();

  const attentionRows = boardRows.filter((row) => row.status === "attention");

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 lg:py-10">
      <header className="mb-8">
        <p className="font-mono text-xs text-muted-foreground">
          Tonight · Grand Ballroom
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome back, {session?.user.name}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          180 guests, service at 7:00 PM.{" "}
          {attentionRows.length > 0
            ? `${attentionRows.length} item${attentionRows.length === 1 ? "" : "s"} need${attentionRows.length === 1 ? "s" : ""} attention before doors.`
            : "Everything is on track for doors."}
        </p>
        <div className="mt-3">
          <LiveUpdates />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card size="sm" className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
            <CardDescription>
              Operational Sessions for your active Venue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SessionList />
          </CardContent>
        </Card>

        {/* Service board */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Service board</CardTitle>
                <CardDescription>
                  Event #4821 · 3 staff leads · updated just now
                </CardDescription>
              </div>
              <Badge variant="secondary" className="gap-1.5">
                <span
                  aria-hidden
                  className="size-1.5 rounded-full bg-primary motion-safe:animate-pulse"
                />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {boardRows.map((row) => (
                <li
                  key={row.title}
                  className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="mt-0.5">
                    <StatusIcon status={row.status} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="text-sm font-medium">{row.title}</span>
                      <Badge variant={stateBadgeVariant[row.status]}>
                        {row.state}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {row.owner} · {row.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 border-t border-border pt-5">
              <p className="mb-3 text-xs font-medium text-muted-foreground">
                Timeline
              </p>
              <ol className="relative flex justify-between">
                <div
                  aria-hidden
                  className="absolute inset-x-2 top-[5px] h-px bg-border"
                />
                {timeline.map((milestone) => (
                  <li
                    key={milestone.time}
                    className="relative flex flex-col items-center gap-2"
                  >
                    <span
                      aria-hidden
                      className={timelineDotClass[milestone.status]}
                    />
                    <div className="text-center">
                      <div className="font-mono text-[11px] font-medium tabular-nums">
                        {milestone.time}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {milestone.label}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Right rail */}
        <div className="flex flex-col gap-6">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Needs attention</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {attentionRows.map((row) => (
                  <li key={row.title} className="flex items-start gap-2.5">
                    <StatusIcon status={row.status} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{row.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>On shift</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {onShift.map((person) => (
                  <li key={person.name} className="flex items-center gap-3">
                    <Avatar size="sm">
                      <AvatarFallback className="bg-secondary text-[10px] font-semibold text-secondary-foreground">
                        {getInitials(person.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {person.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {person.role}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const session = await getUser();
    return { session };
  },
  component: RouteComponent,
  loader: ({ context }) => {
    if (!context.session) {
      throw redirect({
        to: "/login",
      });
    }
  },
});
