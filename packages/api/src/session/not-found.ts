import * as Schema from "effect/Schema";

import { FunctionId, VenueId } from "./domain";

/** A Session was not found in the requested Venue. */
export class NotFound extends Schema.TaggedErrorClass<NotFound>()(
  "Session.NotFound",
  { id: FunctionId, venueId: VenueId }
) {}
