import { Schema } from "effect";

export const LiveResource = Schema.Literals([
  "function",
  "menu",
  "function_assignment",
  "booking",
]);
export type LiveResource = typeof LiveResource.Type;

export const LiveEvent = Schema.Struct({
  resource: LiveResource,
  resourceId: Schema.NonEmptyString,
  venueId: Schema.NonEmptyString,
});
export type LiveEvent = typeof LiveEvent.Type;
