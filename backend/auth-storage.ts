import { Identity, Password, Schema as AuthSchema, Sessions } from "@yielded/auth";
import {
  PersistenceMappingError,
  requiredPasswordConstraints,
  requiredPasswordRegistrationConstraints,
  requiredSessionConstraints,
} from "@yielded/auth-persistence/Adapter";
import type {
  PasswordPersistenceMapping,
  PasswordRegistrationMapping,
  StatefulSessionMapping,
} from "@yielded/auth-persistence-drizzle";
import { and, eq, sql } from "drizzle-orm";
import { DateTime, Effect, Redacted, Schema } from "effect";
import { Auth, authenticationRequirement } from "./auth.ts";
import type { Registration } from "./auth-contract.ts";
import type { Database } from "./database.ts";
import * as Tables from "./auth-tables.ts";
import { TeamMember } from "./current-team-member.ts";

const mappingError = (cause: Schema.SchemaError) =>
  new PersistenceMappingError({ operation: "AuthStorage.decode", cause });
const subjectId = {
  toNative: (id: AuthSchema.SubjectId) => Effect.succeed(id),
  toSubject: (id: string) =>
    Schema.decodeEffect(AuthSchema.SubjectId)(id).pipe(Effect.mapError(mappingError)),
  equals: (left: string, right: string) => left === right,
};
const revision = Effect.sync(() => Sessions.SecurityRevision.make(crypto.randomUUID()));
const engineNow = sql`cast(unixepoch('subsec') * 1000 as integer)`;
const decodeMillis = Schema.decodeUnknownEffect(Schema.Int);
// The adapter walks error causes; classify only SQLite's exact mapped unique key.
const message = Schema.Union([Schema.String, Schema.Struct({ message: Schema.String })]);
const conflict = (columns: string) => (cause: unknown) => {
  const decoded = Schema.decodeUnknownOption(message)(cause);
  if (decoded._tag === "None") return false;
  const diagnostic = Schema.is(Schema.String)(decoded.value)
    ? decoded.value
    : decoded.value.message;
  return (
    diagnostic === `UNIQUE constraint failed: ${columns}` ||
    diagnostic === `D1_ERROR: UNIQUE constraint failed: ${columns}: SQLITE_CONSTRAINT`
  );
};

type PasswordMapping = PasswordPersistenceMapping<
  typeof Tables.subjects,
  typeof Tables.identifiers,
  typeof Tables.passwords,
  typeof Tables.credentials,
  string
>;
const subject: PasswordMapping["subject"] = {
  table: Tables.subjects,
  id: "id",
  status: "active",
  securityRevision: "securityRevision",
  isActiveStatus: (value) => value === 1,
  decodeRequirement: () => Effect.succeed(authenticationRequirement),
  decodeActionRequirement: () => Effect.succeed(authenticationRequirement),
  nextSecurityRevision: () => revision,
  d1ActiveStatusValue: 1,
};
const identifier = {
  table: Tables.identifiers,
  namespace: "namespace",
  value: "value",
  subjectId: "subjectId",
  verifiedAt: "verifiedAt",
  bindingRevision: "bindingRevision",
  isCurrent: () => true,
  d1CurrentCondition: ({
    identifier: input,
    nativeSubjectId,
  }: {
    readonly identifier: Identity.LoginIdentifier;
    readonly nativeSubjectId: string;
  }) =>
    sql`exists(select 1 from ${Tables.identifiers} where ${Tables.identifiers.namespace} = ${input.namespace} and ${Tables.identifiers.value} = ${input.value} and ${Tables.identifiers.subjectId} = ${nativeSubjectId})`,
  encodeInitialInsert: (
    input: Identity.LoginIdentifier,
    id: string,
    bindingRevision: Sessions.SecurityRevision,
  ) => ({ namespace: input.namespace, value: input.value, subjectId: id, bindingRevision }),
} as const;
const authorityCredential = {
  table: Tables.credentials,
  subjectId: "subjectId",
  credentialId: "credentialId",
  revision: "revision",
  d1ActiveStatusValue: 1,
  encodeInsert: (input: {
    readonly subjectId: string;
    readonly credentialId: string;
    readonly revision: Sessions.SecurityRevision;
  }) => input,
  encodeRevision: (value: Sessions.SecurityRevision) => ({ revision: value }),
} as const;

const credential: PasswordMapping["credential"] = {
  table: Tables.passwords,
  moduleId: "moduleId",
  subjectId: "subjectId",
  credentialId: "credentialId",
  credentialRevision: "credentialRevision",
  verifierVersion: "verifierVersion",
  verifier: "verifier",
  normalization: "normalization",
  encodeInsert: ({ replacement, ...input }) => ({
    ...input,
    verifier: Redacted.value(replacement.verifier),
    normalization: replacement.normalization,
  }),
  encodeVerifier: (verifier, verifierVersion) => ({
    verifier: Redacted.value(verifier),
    verifierVersion,
  }),
  encodeReplacement: ({ replacement, ...input }) => ({
    ...input,
    verifier: Redacted.value(replacement.verifier),
    normalization: replacement.normalization,
  }),
  decode: ({ moduleId, subject, identifier, credential }) => {
    const snapshot = {
      moduleId,
      revision: {
        subjectId: subject.id,
        securityRevision: subject.securityRevision,
        credentials: [
          { credentialId: credential.credentialId, revision: credential.credentialRevision },
        ],
      },
      credentialId: credential.credentialId,
      credentialRevision: credential.credentialRevision,
      verifierVersion: credential.verifierVersion,
      verifier: credential.verifier,
      normalization: credential.normalization,
      identifier: { namespace: identifier.namespace, value: identifier.value },
      identifierBindingRevision: identifier.bindingRevision,
    };
    return Schema.decodeUnknownEffect(Password.PasswordCredentialSnapshot)(
      identifier.verifiedAt === null
        ? snapshot
        : { ...snapshot, identifierVerifiedAtMillis: identifier.verifiedAt },
    ).pipe(Effect.mapError(mappingError));
  },
};

/** Explicit D1 password mapping; authority and eligibility are rechecked within each batch. */
export const passwordMapping: PasswordMapping = {
  subject,
  identifier,
  credential,
  authorityCredential,
  subjectId,
  constraints: requiredPasswordConstraints,
  encodeInstant: (value) => value,
  decodeInstant: (value) => decodeMillis(value).pipe(Effect.mapError(mappingError)),
  allocateCredentialId: Effect.sync(() => crypto.randomUUID()),
  allocateRevision: revision,
  sessionInvalidation: "same-authority-immediate",
  clock: {
    encodeInstant: (value) => value,
    decodeInstant: Schema.decodeUnknownSync(Schema.Int),
    engineNowMillis: engineNow,
    toMillis: (value: import("drizzle-orm").SQL) => value,
    fromMillis: (value: import("drizzle-orm").SQL) => value,
  },
  d1: { primary: true },
};

/** Registration commits subject, identifier, verifier, and factor revision atomically. */
export const registrationMapping: PasswordRegistrationMapping<
  Registration,
  typeof Tables.subjects,
  typeof Tables.identifiers,
  typeof Tables.passwords,
  typeof Tables.credentials,
  string
> = {
  subject,
  identifier,
  credential,
  authorityCredential,
  subjectId,
  constraints: requiredPasswordRegistrationConstraints,
  mode: "atomic",
  allocateCredentialId: Effect.sync(() => crypto.randomUUID()),
  allocateRevision: revision,
  provisioning: {
    idMode: "allocated",
    allocateSubjectId: Effect.sync(() => crypto.randomUUID()),
    encodeSubjectInsert: (input, values) => {
      if (values.nativeSubjectId === undefined)
        throw new Error("D1 registration requires an allocated subject ID.");
      return {
        id: values.nativeSubjectId,
        active: 1,
        securityRevision: values.securityRevision,
        name: input.registration.name,
        email: input.identifier.value,
      };
    },
  },
  isIdentifierConflict: conflict("auth_identifiers.namespace, auth_identifiers.value"),
  isCredentialConflict: conflict("auth_passwords.moduleId, auth_passwords.subjectId"),
};

const storedSession = Schema.Struct({
  ...Sessions.SessionMetadata.fields,
  digest: AuthSchema.TokenDigest,
  credentialVersion: Sessions.SessionCredentialVersion,
  assurance: Schema.fromJsonString(Sessions.SessionMetadata.fields.assurance),
  claims: Schema.fromJsonString(TeamMember),
  provenance: Schema.fromJsonString(Sessions.SessionAuthenticationProvenance),
});
const encodeSession = Schema.encodeSync(storedSession);

/** Stateful sessions consult current account and factor revisions on every read and commit. */
export const sessionMapping: StatefulSessionMapping<
  TeamMember,
  typeof Tables.subjects,
  typeof Tables.credentials,
  typeof Tables.sessions,
  typeof Tables.flows,
  string,
  string
> = {
  subject: { ...subject, activeStatusValue: 1, requirementColumns: [] },
  subjectId,
  credential: authorityCredential,
  constraints: requiredSessionConstraints,
  isConstraintConflict: conflict("auth_sessions.digest"),
  moduleId: Auth.sessions.moduleId,
  clock: passwordMapping.clock,
  d1: { primary: true },
  sessionId: {
    toNative: (value) => Effect.succeed(value),
    toSession: (value) =>
      Schema.decodeEffect(Sessions.SessionId)(value).pipe(Effect.mapError(mappingError)),
    equals: (left, right) => left === right,
  },
  session: {
    table: Tables.sessions,
    sessionId: "sessionId",
    subjectId: "subjectId",
    digest: "digest",
    securityRevision: "securityRevision",
    issuedAt: "issuedAt",
    expiresAt: "expiresAt",
    absoluteExpiresAt: "absoluteExpiresAt",
    encodeInstant: DateTime.toEpochMillis,
    // Keep the legacy NOT NULL column populated; current Yielded uses credentialVersion.
    encodeInsert: (record) => ({ ...encodeSession(record), version: record.credentialVersion }),
    encodeRotation: encodeSession,
    decode: (row) => Schema.decodeEffect(storedSession)(row).pipe(Effect.mapError(mappingError)),
    allocateId: Effect.sync(() => crypto.randomUUID()),
  },
};

/** Resolve application identity claims without returning password or session material. */
export const ClaimsLive = (database: Database["Service"]) => ({
  resolve: Effect.fn("AuthStorage.claims")(
    function* ({ subjectId }: { readonly subjectId: AuthSchema.SubjectId }) {
      const rows = yield* database
        .select()
        .from(Tables.subjects)
        .where(and(eq(Tables.subjects.id, subjectId), eq(Tables.subjects.active, 1)))
        .limit(1);
      const row = rows[0];
      if (row === undefined) return yield* Password.PasswordUnavailable.make({});
      return yield* Schema.decodeEffect(TeamMember)(row).pipe(
        Effect.mapError(() => Password.PasswordUnavailable.make({})),
      );
    },
    Effect.mapError(() => Password.PasswordUnavailable.make({})),
  ),
});
