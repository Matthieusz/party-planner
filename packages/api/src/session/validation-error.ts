import * as Schema from "effect/Schema";

/** A request failed validation before entering an application operation. */
export class ValidationError extends Schema.TaggedErrorClass<ValidationError>()(
  "Session.ValidationError",
  { message: Schema.String }
) {}
