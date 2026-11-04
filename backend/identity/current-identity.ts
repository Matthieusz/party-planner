import * as Context from "effect/Context";
import type { AuthenticatedIdentity } from "../../shared/identity/authenticated-identity.ts";

/** Identity supplied exclusively by authentication middleware. */
export class CurrentIdentity extends Context.Service<CurrentIdentity, AuthenticatedIdentity>()(
  "app/CurrentIdentity",
) {}
