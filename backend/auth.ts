import { Auth as YieldedAuth, Password, Sessions } from "@yielded/auth";
import { AuthContract } from "./auth-contract.ts";
import { registrationStrategy } from "./registration.ts";

/** Password authentication with opaque, revocable sessions stored in D1. */
export const Auth = YieldedAuth.make(AuthContract, {
  sessions: Sessions.stateful({ maxAge: "8 hours", idleTimeout: "30 minutes" }),
  strategies: { password: Password.make(), registration: registrationStrategy },
  defaultStrategy: "password",
});

/** Single password factor; policy changes must bump subject security revisions. */
export const authenticationRequirement = Sessions.AuthenticationRequirement.make({
  alternatives: [
    {
      factors: ["knowledge"],
      userVerified: false,
      phishingResistant: false,
      minimumCredentials: 1,
    },
  ],
  maximumAgeMillis: 300_000,
});
