import * as Context from "effect/Context";
import * as Schema from "effect/Schema";

/** Safe identity projection; contains no session tokens or credentials. */
export const TeamMember = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String,
});
/** An authenticated identity, not proof of organization or venue access. */
export interface TeamMember extends Schema.Schema.Type<typeof TeamMember> {}

/** Identity supplied exclusively by authentication middleware. */
export class CurrentTeamMember extends Context.Service<CurrentTeamMember, TeamMember>()("app/CurrentTeamMember") {}
