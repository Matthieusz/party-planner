import { PartyPlannerApi } from "@party-planner/api";
import { env } from "@party-planner/env/web";
import { Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { AtomHttpApi } from "effect/unstable/reactivity";

const browserHttpClientLayer = FetchHttpClient.layer.pipe(
  Layer.provide(
    Layer.succeed(FetchHttpClient.RequestInit, { credentials: "include" })
  )
);

/** Schema-derived, credential-preserving Atom client for the Party Planner API. */
export class PartyPlannerClient extends AtomHttpApi.Service<PartyPlannerClient>()(
  "@party-planner/web/PartyPlannerClient",
  {
    api: PartyPlannerApi,
    baseUrl: env.VITE_SERVER_URL,
    httpClient: browserHttpClientLayer,
  }
) {}
