import * as Cloudflare from "alchemy/Cloudflare";

/** D1 resource used by Better Auth; its schema is migrated by the integration. */
export const AuthDb = Cloudflare.D1.Database("AuthDb");
