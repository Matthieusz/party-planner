import { Schema } from "effect";

/** Failure of the Session persistence adapter. */
export class PersistenceError extends Schema.TaggedErrorClass<PersistenceError>()(
  "Session.PersistenceError",
  { cause: Schema.Defect(), operation: Schema.String }
) {}
