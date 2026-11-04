import * as D1 from "@alchemy.run/cloudflare/D1";

/** Fresh Better Auth store; Alchemy's integration owns its schema migrations. */
export const AuthDb = D1.Database("BetterAuthDb");
