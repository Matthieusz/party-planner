import { Password } from "@yielded/auth";
import { Context, Effect, Schema } from "effect";
import { RegisterInput } from "./auth-contract.ts";

/** Application registration delegates credential creation to Yielded's atomic D1 authority. */
export class Registration extends Context.Service<
  Registration,
  {
    readonly register: (
      input: RegisterInput,
    ) => Effect.Effect<
      { readonly _tag: "RegistrationAccepted" },
      | Password.PasswordUnavailable
      | Password.NewPasswordRejected
      | Password.PasswordCheckUnavailable
    >;
  }
>()("app/Registration") {}

/** Registration-only method keeps password recovery and delivery out of this application's contract. */
export const registrationStrategy = {
  make: Effect.gen(function* () {
    const registration = yield* Registration;
    return {
      register: Effect.fn("Registration.request")(function* (input: typeof RegisterInput.Encoded) {
        const parsed = yield* Schema.decodeEffect(RegisterInput)(input).pipe(
          Effect.mapError(() => Password.PasswordRejected.make({})),
        );
        return yield* registration.register(parsed);
      }),
    };
  }),
};
