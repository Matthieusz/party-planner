/* eslint-disable max-classes-per-file -- Auth boundary schemas and service share one public module. */
import * as schema from "@party-planner/db/schema/auth";
import { ServerConfig } from "@party-planner/env/server";
import type { ServerConfigShape } from "@party-planner/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins/organization";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Context, Effect, Layer, Redacted, Schema } from "effect";
import { Pool } from "pg";

export const StaffRole = Schema.Literals([
  "admin",
  "coordinator",
  "kitchen",
  "service",
]);
export type StaffRole = typeof StaffRole.Type;

export const RequestIdentity = Schema.Struct({
  role: StaffRole,
  staffId: Schema.NonEmptyString,
  userId: Schema.NonEmptyString,
  venueId: Schema.NonEmptyString,
});
export type RequestIdentity = typeof RequestIdentity.Type;

/** Identity supplied explicitly for one request; it has no ambient default. */
export class CurrentIdentity extends Context.Service<
  CurrentIdentity,
  RequestIdentity
>()("@party-planner/auth/CurrentIdentity") {}

export const currentIdentityLayer = (identity: RequestIdentity) =>
  Layer.succeed(CurrentIdentity, identity);

export class Unauthenticated extends Schema.TaggedErrorClass<Unauthenticated>()(
  "Auth.Unauthenticated",
  {}
) {}

export class ActiveVenueRequired extends Schema.TaggedErrorClass<ActiveVenueRequired>()(
  "Auth.ActiveVenueRequired",
  {}
) {}

export class MembershipNotFound extends Schema.TaggedErrorClass<MembershipNotFound>()(
  "Auth.MembershipNotFound",
  { userId: Schema.String, venueId: Schema.String }
) {}

export class AuthAdapterError extends Schema.TaggedErrorClass<AuthAdapterError>()(
  "Auth.AdapterError",
  { cause: Schema.Defect(), operation: Schema.String }
) {}

const buildAuth = (
  database: ReturnType<typeof drizzle>,
  config: ServerConfigShape
) =>
  betterAuth({
    advanced: {
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      },
    },
    baseURL: config.betterAuthUrl,
    database: drizzleAdapter(database, { provider: "pg", schema }),
    emailAndPassword: { enabled: true },
    plugins: [organization()],
    secret: Redacted.value(config.betterAuthSecret),
    trustedOrigins: [config.corsOrigin],
  });

type AuthInstance = ReturnType<typeof buildAuth>;
type IdentityError =
  | Unauthenticated
  | ActiveVenueRequired
  | MembershipNotFound
  | AuthAdapterError;

export interface AuthServiceShape {
  readonly handler: AuthInstance["handler"];
  readonly resolveIdentity: (
    headers: Headers
  ) => Effect.Effect<RequestIdentity, IdentityError>;
}

/** Better Auth boundary and request-scoped Staff identity resolution. */
export class AuthService extends Context.Service<
  AuthService,
  AuthServiceShape
>()("@party-planner/auth/AuthService") {}

export const authServiceLayer = Layer.effect(
  AuthService,
  Effect.gen(function* makeAuthService() {
    const config = yield* ServerConfig;
    const pool = yield* Effect.acquireRelease(
      Effect.sync(
        () =>
          new Pool({
            application_name: "party-planner-auth",
            connectionString: Redacted.value(config.databaseUrl),
          })
      ),
      (ownedPool) => Effect.promise(() => ownedPool.end())
    );
    const database = drizzle({ client: pool });
    const auth = buildAuth(database, config);

    const resolveIdentity = Effect.fn("Auth.resolveIdentity")(
      function* resolveIdentity(headers: Headers) {
        const authSession = yield* Effect.tryPromise({
          catch: (cause) =>
            new AuthAdapterError({ cause, operation: "getSession" }),
          try: () => auth.api.getSession({ headers }),
        });
        if (!authSession) {
          return yield* new Unauthenticated();
        }
        const venueId = authSession.session.activeOrganizationId;
        if (!venueId) {
          return yield* new ActiveVenueRequired();
        }

        const rows = yield* Effect.tryPromise({
          catch: (cause) =>
            new AuthAdapterError({ cause, operation: "resolveMembership" }),
          try: () =>
            database
              .select({ id: schema.member.id, role: schema.member.role })
              .from(schema.member)
              .where(
                and(
                  eq(schema.member.organizationId, venueId),
                  eq(schema.member.userId, authSession.user.id)
                )
              )
              .limit(1),
        });
        const [membership] = rows;
        if (!membership) {
          return yield* new MembershipNotFound({
            userId: authSession.user.id,
            venueId,
          });
        }

        return yield* Schema.decodeUnknownEffect(RequestIdentity)({
          role: membership.role,
          staffId: membership.id,
          userId: authSession.user.id,
          venueId,
        }).pipe(
          Effect.mapError(
            (cause) =>
              new AuthAdapterError({ cause, operation: "decodeIdentity" })
          )
        );
      },
      (effect) => effect.pipe(Effect.withSpan("Auth.resolveIdentity"))
    );

    return AuthService.of({ handler: auth.handler, resolveIdentity });
  })
);
