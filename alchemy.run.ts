import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
import ApiWorker from "./backend/worker.ts";

/** Owns the application Worker, D1, migrations, and generated auth secret. */
export default Alchemy.Stack(
  "VenueOperations",
  { providers: Cloudflare.providers(), state: Alchemy.localState() },
  Effect.gen(function* () {
    const worker = yield* ApiWorker;
    return { url: worker.url };
  }),
);
