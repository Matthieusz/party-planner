import { createAuthClient } from "better-auth/client";
import { Context, Layer } from "effect";

/** Browser-only Better Auth client, acquired by the Foldkit runtime rather than at module load. */
export class AuthClient extends Context.Service<AuthClient, ReturnType<typeof createAuthClient>>()(
  "app/AuthClient",
) {}

/** Use the browser's origin so sign-in cookies and protected API requests remain same-origin. */
export const authClientLayer = (origin: string) =>
  Layer.sync(AuthClient, () => createAuthClient({ baseURL: origin }));
