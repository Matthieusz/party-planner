import { BetterAuth } from "@alchemy.run/better-auth";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

const makeAuth = BetterAuth({
  baseURL: "http://localhost:1339",
  basePath: "/api/auth",
  trustedOrigins: ["http://localhost:1339", "http://localhost:1337"],
  emailAndPassword: { enabled: true },
});

/** Request-scoped auth capabilities backed by the first-party integration. */
export class Auth extends Context.Service<
  Auth,
  Pick<Effect.Success<typeof makeAuth>, "fetch" | "getSession">
>()("app/Auth") {
  /** Acquires auth using the explicitly provided database layer. */
  static readonly layer = Layer.effect(Auth, makeAuth);
}
