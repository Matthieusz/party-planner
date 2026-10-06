import { Identity, Password, Schema as AuthSchema, Sessions } from "@yielded/auth";
import {
  PersistenceMappingError,
  requiredPasswordConstraints,
  requiredPasswordRegistrationConstraints,
  requiredSessionConstraints,
} from "@yielded/auth-persistence/Adapter";
import type {
  D1PasswordPersistenceMapping,
  PasswordRegistrationMapping,
  D1StatefulSessionMapping,
} from "@yielded/auth-persistence-drizzle";
import { and, eq, sql } from "drizzle-orm";
import { DateTime, Effect, Redacted, Schema } from "effect";
import { authenticationRequirement } from "./auth.ts";
import type { Registration } from "./auth-contract.ts";
import type { Database } from "./database.ts";
import * as Tables from "./auth-tables.ts";
import { TeamMember } from "./current-team-member.ts";

const mappingError = (cause: Schema.SchemaError) =>
  new PersistenceMappingError({ operation: "AuthStorage.decode", cause });
const subjectId = {
  toNative: (id: AuthSchema.SubjectId) => Effect.succeed(id),
  toSubject: (id: string) =>
    Schema.decodeUnknownEffect(AuthSchema.SubjectId)(id).pipe(Effect.mapError(mappingError)),
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

type PasswordMapping = D1PasswordPersistenceMapping<
  typeof Tables.subjects,
  typeof Tables.identifiers,
  typeof Tables.passwords,
  typeof Tables.credentials,
  typeof Tables.attempts,
  typeof Tables.commands,
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
  attempt: {
    table: Tables.attempts,
    moduleId: "moduleId",
    action: "action",
    attemptId: "attemptId",
    identifierNamespace: "identifierNamespace",
    identifierValue: "identifierValue",
    subjectId: "subjectId",
    credentialId: "credentialId",
    securityRevision: "securityRevision",
    credentialRevision: "credentialRevision",
    verifierVersion: "verifierVersion",
    identifierBindingRevision: "identifierBindingRevision",
    admittedAt: "admittedAt",
    deadline: "deadline",
    retentionUntil: "retentionUntil",
    state: "state",
    encodeInsert: (
      { identifier, admittedAtMillis, deadlineMillis, retentionUntilMillis, ...record },
      input,
    ) => ({
      ...record,
      subjectId: input.nativeSubjectId ?? null,
      identifierNamespace: identifier.namespace,
      identifierValue: identifier.value,
      admittedAt: admittedAtMillis,
      deadline: deadlineMillis,
      retentionUntil: retentionUntilMillis,
      state: input.state,
    }),
  },
  command: {
    table: Tables.commands,
    moduleId: "moduleId",
    commandId: "commandId",
    action: "action",
    bindingDigest: "bindingDigest",
    decision: "decision",
    retentionUntil: "retentionUntil",
    encodeInsert: ({ retentionUntilMillis, ...input }) => ({
      ...input,
      retentionUntil: retentionUntilMillis,
    }),
  },
  encodeInstant: (value) => value,
  decodeInstant: (value) => decodeMillis(value).pipe(Effect.mapError(mappingError)),
  allocateAttemptId: Effect.sync(() => Password.PasswordAttemptId.make(crypto.randomUUID())),
  allocateCredentialId: Effect.sync(() => crypto.randomUUID()),
  allocateRevision: revision,
  commandRetentionMillis: 86_400_000,
  sessionInvalidation: "same-authority-immediate",
  isCommandConflict: conflict("auth_commands.moduleId, auth_commands.commandId"),
  d1: {
    engineNow,
    engineNowMillis: engineNow,
    engineInstantMinus: (millis) => sql`${engineNow} - ${millis}`,
    engineInstantPlus: (millis) => sql`${engineNow} + ${millis}`,
  },
};

/** Registration commits subject, identifier, verifier, factor revision, and receipt atomically. */
export const registrationMapping: PasswordRegistrationMapping<
  Registration,
  typeof Tables.subjects,
  typeof Tables.identifiers,
  typeof Tables.passwords,
  typeof Tables.credentials,
  typeof Tables.registrations,
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
  registration: {
    table: Tables.registrations,
    moduleId: "moduleId",
    requestId: "requestId",
    state: "state",
    subjectId: "subjectId",
    recoveryReference: "recoveryReference",
    encodeInsert: (input, state) => ({
      moduleId: input.moduleId,
      requestId: input.requestId,
      state: state.state,
      subjectId: state.nativeSubjectId ?? null,
      recoveryReference: state.recoveryReference ?? null,
    }),
    decodeReplay: () => Effect.succeed({ _tag: "Suppressed" }),
  },
  isRequestConflict: conflict("auth_registrations.moduleId, auth_registrations.requestId"),
  isIdentifierConflict: conflict("auth_identifiers.namespace, auth_identifiers.value"),
  isCredentialConflict: conflict("auth_passwords.moduleId, auth_passwords.subjectId"),
};

const storedSession = Schema.Struct({
  ...Sessions.SessionMetadata.fields,
  digest: AuthSchema.TokenDigest,
  version: Sessions.SecurityRevision,
  credentialVersion: Sessions.SessionCredentialVersion,
  assurance: Schema.fromJsonString(Sessions.SessionMetadata.fields.assurance),
  claims: Schema.fromJsonString(TeamMember),
  provenance: Schema.fromJsonString(Sessions.SessionAuthenticationProvenance),
});
const encodeSession = Schema.encodeSync(storedSession);

/** Stateful sessions consult current account and factor revisions on every read and commit. */
export const sessionMapping: D1StatefulSessionMapping<
  TeamMember,
  typeof Tables.subjects,
  typeof Tables.credentials,
  typeof Tables.sessions,
  typeof Tables.flows,
  typeof Tables.flows,
  string,
  string
> = {
  subject,
  subjectId,
  credential: authorityCredential,
  constraints: requiredSessionConstraints,
  isConstraintConflict: conflict("auth_sessions.digest"),
  d1: { engineNow, engineNowMillis: engineNow, activeSubjectStatusValue: 1 },
  sessionId: {
    toNative: (value) => Effect.succeed(value),
    toSession: (value) =>
      Schema.decodeUnknownEffect(Sessions.SessionId)(value).pipe(Effect.mapError(mappingError)),
    equals: (left, right) => left === right,
  },
  session: {
    table: Tables.sessions,
    sessionId: "sessionId",
    subjectId: "subjectId",
    digest: "digest",
    version: "version",
    securityRevision: "securityRevision",
    issuedAt: "issuedAt",
    expiresAt: "expiresAt",
    absoluteExpiresAt: "absoluteExpiresAt",
    encodeInstant: DateTime.toEpochMillis,
    encodeInsert: (record) => encodeSession(record),
    encodeRotation: encodeSession,
    decode: (row) =>
      Schema.decodeUnknownEffect(storedSession)(row).pipe(Effect.mapError(mappingError)),
    allocateId: Effect.sync(() => crypto.randomUUID()),
    allocateVersion: revision,
  },
  flow: {
    table: Tables.flows,
    flowId: "flowId",
    subjectId: "subjectId",
    state: "state",
    pendingDigest: "pendingDigest",
    dedupUntil: "dedupUntil",
    pendingStateValue: "pending",
    establishedStateValue: "established",
    encodeInstant: DateTime.toEpochMillis,
    decodeInstant: (value) =>
      Schema.decodeUnknownEffect(Schema.DateTimeUtcFromMillis)(value).pipe(
        Effect.mapError(mappingError),
      ),
    encodePendingInsert: ({ evidence, subjectId, pendingDigest, dedupUntil }) => ({
      flowId: evidence.flowId,
      subjectId,
      pendingDigest,
      state: "pending",
      dedupUntil: DateTime.toEpochMillis(dedupUntil),
    }),
    encodeEstablishedInsert: ({ evidence, subjectId, dedupUntil }) => ({
      flowId: evidence.flowId,
      subjectId,
      state: "established",
      dedupUntil: DateTime.toEpochMillis(dedupUntil),
    }),
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
      return yield* Schema.decodeUnknownEffect(TeamMember)(row).pipe(
        Effect.mapError(() => Password.PasswordUnavailable.make({})),
      );
    },
    Effect.mapError(() => Password.PasswordUnavailable.make({})),
  ),
});
