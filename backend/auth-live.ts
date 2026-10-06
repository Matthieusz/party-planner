import { Hooks, Password, Sessions } from "@yielded/auth";
import * as D1 from "@yielded/auth-persistence-drizzle/D1";
import * as Portable from "@yielded/crypto/Portable";
import * as WebCrypto from "@yielded/crypto/WebCrypto";
import { Context, Effect, Layer } from "effect";
import { Auth } from "./auth.ts";
import {
  ClaimsLive,
  passwordMapping,
  registrationMapping,
  sessionMapping,
} from "./auth-storage.ts";
import { Database } from "./database.ts";
import { PasswordLimitsLive } from "./password-limits.ts";
import { Registration } from "./registration.ts";
import { ScreeningLive } from "./password-screening.ts";

// Workers cannot wait on another request's semaphore continuations. Excess work fails immediately.
const admission = Password.PasswordKdfAdmission.layer({ concurrency: 1, maxQueued: 0 });
const cryptoLive = Layer.merge(
  WebCrypto.layerCryptoWeb,
  Portable.layer(globalThis.crypto.subtle).pipe(Layer.provideMerge(admission)),
);

const persistenceLive = Layer.effectContext(
  Effect.gen(function* () {
    const database = yield* Database;
    const password = yield* D1.makePasswordPersistenceServices(passwordMapping);
    const authority = yield* D1.makeAuthenticationAuthorityServices({
      subject: sessionMapping.subject,
      subjectId: sessionMapping.subjectId,
      credential: sessionMapping.credential,
      d1: sessionMapping.d1,
      isConstraintConflict: sessionMapping.isConstraintConflict,
    });
    const sessions = yield* D1.makeStatefulSessionServices(sessionMapping);
    return Context.empty().pipe(
      Context.add(Password.PasswordPersistence, password.passwordPersistence),
      Context.add(Sessions.AuthenticationAuthority, authority.authenticationAuthority),
      Context.add(Auth.sessions.StatefulSessionPersistence, sessions.statefulSessionPersistence),
      Context.add(Auth.sessions.SessionRepository, sessions.sessionRepository),
      Context.add(Auth.strategies.password.SessionClaims, ClaimsLive(database)),
    );
  }),
);
const registrationLive = Layer.effect(
  Registration,
  Effect.gen(function* () {
    const authority = yield* D1.makePasswordRegistrationServices(registrationMapping);
    const check = yield* Password.NewPasswordCheck;
    const hashing = yield* Password.PasswordHashing;
    return Registration.of({
      register: Effect.fn("Registration.register")(function* (input) {
        const checked = yield* check.check(input.newPassword, {
          accountName: input.email,
          serviceName: "Venue Operations",
        });
        const verifier = yield* hashing
          .hash(checked.password)
          .pipe(Effect.mapError(() => Password.PasswordUnavailable.make({})));
        const receipt = yield* authority.registrationAuthority.register(
          {
            moduleId: Auth.strategies.password.persistence.moduleId,
            requestId: input.requestId,
            identifier: { namespace: "email", value: input.email },
            registration: input.registration,
            replacement: { verifier, normalization: checked.normalization },
          },
          (_decision, journal) => journal.prepare({ _tag: "RegistrationAccepted" as const }),
        );
        return yield* receipt.read.pipe(
          Effect.mapError(() => Password.PasswordUnavailable.make({})),
        );
      }),
    });
  }),
);
const checks = Password.NewPasswordCheck.layer({
  ...Password.defaultPasswordPolicy,
  minimumCodePoints: 8,
}).pipe(Layer.provide(ScreeningLive));

/** Isolate-owned crypto and password screening services are shared across requests. */
export const AuthRuntimeLive = Layer.mergeAll(
  checks,
  Password.PasswordHashing.layer().pipe(Layer.provide(cryptoLive)),
  Hooks.LifecycleHooks.empty,
  cryptoLive,
);

/** Yielded uses the application Drizzle instance; cryptography and password checks come from the isolate. */
export const AuthLive = Auth.layer.pipe(
  Layer.provide([persistenceLive, registrationLive, PasswordLimitsLive]),
  Layer.provide(Layer.effect(D1.Database, Database)),
);
