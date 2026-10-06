import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/** Application identities, separate from credential and session records. */
export const subjects = sqliteTable("auth_subjects", {
  id: text().primaryKey(),
  active: integer().notNull(),
  securityRevision: text().notNull(),
  name: text().notNull(),
  email: text().notNull(),
});
/** Email ownership and binding revision checked again during credential commits. */
export const identifiers = sqliteTable(
  "auth_identifiers",
  {
    namespace: text().notNull(),
    value: text().notNull(),
    subjectId: text()
      .notNull()
      .references(() => subjects.id),
    verifiedAt: integer(),
    bindingRevision: text().notNull(),
  },
  (t) => [uniqueIndex("auth_identifiers_key").on(t.namespace, t.value)],
);
/** Current factor revisions used by authentication authority. */
export const credentials = sqliteTable(
  "auth_credentials",
  {
    subjectId: text()
      .notNull()
      .references(() => subjects.id),
    credentialId: text().notNull(),
    revision: text().notNull(),
  },
  (t) => [uniqueIndex("auth_credentials_key").on(t.subjectId, t.credentialId)],
);
/** Argon2id verifiers and their text normalization provenance. */
export const passwords = sqliteTable(
  "auth_passwords",
  {
    moduleId: text().notNull(),
    subjectId: text()
      .notNull()
      .references(() => subjects.id),
    credentialId: text().notNull(),
    credentialRevision: text().notNull(),
    verifierVersion: text().notNull(),
    verifier: text().notNull(),
    normalization: text().notNull(),
  },
  (t) => [
    uniqueIndex("auth_passwords_subject").on(t.moduleId, t.subjectId),
    uniqueIndex("auth_passwords_credential").on(t.moduleId, t.credentialId),
  ],
);
/** Durable password attempt admission and captured revisions. */
export const attempts = sqliteTable(
  "auth_attempts",
  {
    moduleId: text().notNull(),
    action: text().notNull(),
    attemptId: text().notNull(),
    identifierNamespace: text().notNull(),
    identifierValue: text().notNull(),
    subjectId: text(),
    credentialId: text(),
    securityRevision: text(),
    credentialRevision: text(),
    verifierVersion: text(),
    identifierBindingRevision: text(),
    admittedAt: integer().notNull(),
    deadline: integer().notNull(),
    retentionUntil: integer().notNull(),
    state: text().notNull(),
  },
  (t) => [uniqueIndex("auth_attempts_key").on(t.moduleId, t.attemptId)],
);
/** Credential mutation receipts; no mutation endpoint is currently exposed. */
export const commands = sqliteTable(
  "auth_commands",
  {
    moduleId: text().notNull(),
    commandId: text().notNull(),
    action: text().notNull(),
    bindingDigest: text().notNull(),
    decision: text().notNull(),
    retentionUntil: integer().notNull(),
  },
  (t) => [uniqueIndex("auth_commands_key").on(t.moduleId, t.commandId)],
);
/** Registration replay receipts never expose the subject or its credentials. */
export const registrations = sqliteTable(
  "auth_registrations",
  {
    moduleId: text().notNull(),
    requestId: text().notNull(),
    state: text().notNull(),
    subjectId: text(),
    recoveryReference: text(),
  },
  (t) => [
    uniqueIndex("auth_registrations_key").on(t.moduleId, t.requestId),
    uniqueIndex("auth_registrations_recovery").on(t.recoveryReference),
  ],
);
/** Private session records; only the bearer digest is persisted. */
export const sessions = sqliteTable(
  "auth_sessions",
  {
    sessionId: text().primaryKey(),
    subjectId: text()
      .notNull()
      .references(() => subjects.id),
    digest: text().notNull(),
    version: text().notNull(),
    securityRevision: text().notNull(),
    issuedAt: integer().notNull(),
    expiresAt: integer().notNull(),
    absoluteExpiresAt: integer().notNull(),
    assurance: text().notNull(),
    claims: text().notNull(),
    provenance: text().notNull(),
    credentialVersion: text().notNull(),
  },
  (t) => [uniqueIndex("auth_sessions_digest").on(t.digest)],
);
/** Authentication flow deduplication owned by the session adapter. */
export const flows = sqliteTable("auth_flows", {
  flowId: text().primaryKey(),
  subjectId: text().notNull(),
  state: text().notNull(),
  pendingDigest: text(),
  dedupUntil: integer().notNull(),
});
