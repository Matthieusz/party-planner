import { HydrationBoundary, RegistryContext } from "@effect/atom-react";
import { Toaster } from "@party-planner/ui/components/sonner";
import { TooltipProvider } from "@party-planner/ui/components/tooltip";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createMiddleware } from "@tanstack/react-start";
import type * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry";
import type * as Hydration from "effect/unstable/reactivity/Hydration";
import { evlogErrorHandler } from "evlog/nitro/v3";
import { ThemeProvider } from "next-themes";

import Header from "../components/header";

import appCss from "../index.css?url";
export interface RouterAppContext {
  readonly atomHydration: readonly Hydration.DehydratedAtom[];
  readonly atomRegistry: AtomRegistry.AtomRegistry;
}

const RootDocument = () => {
  // eslint-disable-next-line no-use-before-define -- Route owns the typed root context hook.
  const { atomHydration, atomRegistry } = Route.useRouteContext();
  return (
    <RegistryContext.Provider value={atomRegistry}>
      <HydrationBoundary state={atomHydration}>
        <html lang="en" className="scroll-smooth" suppressHydrationWarning>
          <head>
            <HeadContent />
          </head>

          <body>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <a
                href="#content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:inline-flex focus:h-10 focus:items-center focus:rounded-lg focus:bg-primary focus:px-4 focus:text-sm focus:font-medium focus:text-primary-foreground"
              >
                Skip to content
              </a>
              <div className="grid min-h-svh grid-rows-[auto_1fr]">
                <Header />
                <main id="content">
                  <Outlet />
                </main>
              </div>
              <Toaster richColors />
              <TooltipProvider />
              <TanStackRouterDevtools position="bottom-left" />
            </ThemeProvider>
            <Scripts />
            {/* impeccable-live-start */}
            <script src="http://localhost:8400/live.js"></script>
            {/* impeccable-live-end */}
          </body>
        </html>
      </HydrationBoundary>
    </RegistryContext.Provider>
  );
};

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootDocument,

  head: () => ({
    links: [
      {
        href: appCss,
        rel: "stylesheet",
      },
    ],
    meta: [
      {
        charSet: "utf-8",
      },
      {
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
        name: "viewport",
      },
      {
        title: "Party Planner",
      },
    ],
  }),

  server: {
    middleware: [createMiddleware().server(evlogErrorHandler)],
  },
});
