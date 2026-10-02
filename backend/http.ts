import * as Http from "alchemy/Http";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder";
import { Api } from "./api.ts";
import { CurrentTeamMember } from "./current-team-member.ts";
import { Authentication } from "./middleware.ts";

const publicLive = HttpApiBuilder.group(Api, "public", (handlers) =>
  handlers.handle("health", () => Effect.succeed({ ok: true as const })),
);
const identityLive = HttpApiBuilder.group(Api, "identity", (handlers) =>
  handlers.handle("me", () => CurrentTeamMember),
);

/** HTTP routes with authentication and platform dependencies wired explicitly. */
export const HttpLive = HttpApiBuilder.layer(Api).pipe(
  Layer.provide([publicLive, identityLive]),
  Layer.provide(Authentication.layer),
  Layer.provide(Http.Platform),
);
