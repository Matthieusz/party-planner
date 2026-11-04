import * as Schema from "effect/Schema";

/** Safe identity projection; contains no session tokens or credentials. */
export const AuthenticatedIdentity = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String,
});
/** An authenticated identity, not proof of Venue Membership or access. */
export interface AuthenticatedIdentity extends Schema.Schema.Type<typeof AuthenticatedIdentity> {}
