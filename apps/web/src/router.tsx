import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry";

import "./index.css";
import Loader from "./components/loader";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const registry = AtomRegistry.make();
  const router = createTanStackRouter({
    context: { atomHydration: [], atomRegistry: registry },
    defaultNotFoundComponent: () => <div>Not Found</div>,
    defaultPendingComponent: () => <Loader />,
    defaultPreloadStaleTime: 0,
    routeTree,
    scrollRestoration: true,
  });

  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
