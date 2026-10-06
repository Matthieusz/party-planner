import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Stage } from "alchemy/Stage";
import * as Config from "effect/Config";
import * as Schema from "effect/Schema";
import * as Effect from "effect/Effect";
import ApiWorker from "./backend/worker.ts";

/** Owns the application Worker, D1, and committed auth migrations. */
export default Alchemy.Stack(
  "VenueOperations",
  { providers: Cloudflare.providers(), state: Alchemy.localState() },
  Effect.gen(function* () {
    const stage = yield* Stage;
    if (stage === "production") {
      yield* Config.schema(
        Schema.String.check(
          Schema.makeFilter((value) => {
            const parsed = Schema.decodeUnknownOption(Schema.URLFromString)(value);
            return (
              parsed._tag === "Some" &&
              parsed.value.protocol === "https:" &&
              parsed.value.origin === value &&
              !parsed.value.hostname.includes("*")
            );
          }),
        ),
        "AUTH_ORIGIN",
      );
    }
    const worker = yield* ApiWorker;
    return { url: worker.url };
  }),
);
