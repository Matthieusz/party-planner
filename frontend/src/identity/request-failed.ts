import { Schema } from "effect";

/** Safe application failure; underlying adapter evidence remains redacted in diagnostics. */
export class RequestFailed extends Schema.TaggedError<
  RequestFailed,
  { readonly brand: unique symbol }
>()("RequestFailed", {
  message: Schema.String,
  cause: Schema.optionalKey(Schema.Redacted(Schema.Defect())),
}) {}
