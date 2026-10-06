import { AuthContract as YieldedContract, Password, Schema as AuthSchema } from "@yielded/auth";
import * as Schema from "effect/Schema";
import { TeamMember } from "./current-team-member.ts";

/** Application-owned registration data; credentials belong to Yielded Auth. */
export const Registration = Schema.Struct({
  name: Schema.NonEmptyString.check(Schema.isMaxLength(80)),
});
/** Registration data decoded at the HTTP boundary. */
export interface Registration extends Schema.Schema.Type<typeof Registration> {}

/** Registration input parses credentials to redacted values at ingress. */
export const RegisterInput = Schema.Struct({
  requestId: Password.PasswordCommandId,
  email: Schema.String.check(Schema.isMaxLength(320)).pipe(Schema.decodeTo(AuthSchema.Email)),
  newPassword: Schema.RedactedFromValue(Schema.String.check(Schema.isMaxLength(4096))),
  registration: Registration,
});
/** Decoded registration request. */
export interface RegisterInput extends Schema.Schema.Type<typeof RegisterInput> {}

/** Shared browser/server actions; registration does not itself issue a session. */
export const AuthContract = YieldedContract.make("app/Auth", {
  basePath: "/api/auth",
  claims: TeamMember,
  actions: (sessions) => ({
    signIn: YieldedContract.passwordSignIn(sessions, { strategy: "password" }),
    register: YieldedContract.action({
      payload: RegisterInput,
      success: Schema.Union([
        Schema.TaggedStruct("RegistrationAccepted", {}),
        Schema.TaggedStruct("ProvisioningPending", { reference: Schema.String }),
      ]),
      error: Schema.Union([
        Password.PasswordRejected,
        Password.PasswordUnavailable,
        Password.PasswordActionRequired,
        Password.PasswordMethodUnsupported,
        Password.NewPasswordRejected,
        Password.PasswordCheckUnavailable,
      ]),
      strategy: "registration",
      method: "register",
      mode: "mutation",
      replay: "idempotent",
    }),
  }),
});
