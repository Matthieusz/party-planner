import * as Schema from "effect/Schema";

import { FunctionId, StaffId, VenueId } from "./domain";

/** The Staff member lacks assignment- or role-based authority. */
export class Forbidden extends Schema.TaggedErrorClass<Forbidden>()(
  "Session.Forbidden",
  { id: FunctionId, staffId: StaffId, venueId: VenueId }
) {}
