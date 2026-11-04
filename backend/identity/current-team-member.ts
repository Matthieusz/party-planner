import * as Context from "effect/Context";
import type { TeamMember } from "../../shared/identity/team-member.ts";

/** Identity supplied exclusively by authentication middleware. */
export class CurrentTeamMember extends Context.Service<CurrentTeamMember, TeamMember>()(
  "app/CurrentTeamMember",
) {}
