import type { RequestIdentity } from "@party-planner/auth";
import type { DatabaseShape } from "@party-planner/db";
import { Option } from "effect";

export interface CreateContextOptions {
  readonly database: DatabaseShape;
  readonly identity: Option.Option<RequestIdentity>;
}

export const createContext = ({
  database,
  identity,
}: CreateContextOptions) => ({
  auth: Option.getOrNull(identity),
  database,
  session: Option.match(identity, {
    onNone: () => null,
    onSome: ({ userId }) => ({ user: { id: userId } }),
  }),
});

export type Context = ReturnType<typeof createContext>;
