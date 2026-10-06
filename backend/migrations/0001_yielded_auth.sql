CREATE TABLE auth_subjects (
  "id" TEXT PRIMARY KEY,
  "active" INTEGER NOT NULL,
  "securityRevision" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL
);

CREATE TABLE auth_identifiers (
  "namespace" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL REFERENCES auth_subjects(id),
  "verifiedAt" INTEGER,
  "bindingRevision" TEXT NOT NULL
);

CREATE UNIQUE INDEX auth_identifiers_key ON auth_identifiers (namespace, value);

CREATE TABLE auth_credentials (
  "subjectId" TEXT NOT NULL REFERENCES auth_subjects(id),
  "credentialId" TEXT NOT NULL,
  "revision" TEXT NOT NULL
);

CREATE UNIQUE INDEX auth_credentials_key ON auth_credentials (subjectId, credentialId);

CREATE TABLE auth_passwords (
  "moduleId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL REFERENCES auth_subjects(id),
  "credentialId" TEXT NOT NULL,
  "credentialRevision" TEXT NOT NULL,
  "verifierVersion" TEXT NOT NULL,
  "verifier" TEXT NOT NULL,
  "normalization" TEXT NOT NULL
);

CREATE UNIQUE INDEX auth_passwords_subject ON auth_passwords (moduleId, subjectId);

CREATE UNIQUE INDEX auth_passwords_credential ON auth_passwords (moduleId, credentialId);

CREATE TABLE auth_attempts (
  "moduleId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "identifierNamespace" TEXT NOT NULL,
  "identifierValue" TEXT NOT NULL,
  "subjectId" TEXT,
  "credentialId" TEXT,
  "securityRevision" TEXT,
  "credentialRevision" TEXT,
  "verifierVersion" TEXT,
  "identifierBindingRevision" TEXT,
  "admittedAt" INTEGER NOT NULL,
  "deadline" INTEGER NOT NULL,
  "retentionUntil" INTEGER NOT NULL,
  "state" TEXT NOT NULL
);

CREATE UNIQUE INDEX auth_attempts_key ON auth_attempts (moduleId, attemptId);

CREATE TABLE auth_commands (
  "moduleId" TEXT NOT NULL,
  "commandId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "bindingDigest" TEXT NOT NULL,
  "decision" TEXT NOT NULL,
  "retentionUntil" INTEGER NOT NULL
);

CREATE UNIQUE INDEX auth_commands_key ON auth_commands (moduleId, commandId);

CREATE TABLE auth_registrations (
  "moduleId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "subjectId" TEXT,
  "recoveryReference" TEXT
);

CREATE UNIQUE INDEX auth_registrations_key ON auth_registrations (moduleId, requestId);

CREATE UNIQUE INDEX auth_registrations_recovery ON auth_registrations (recoveryReference);

CREATE TABLE auth_sessions (
  "sessionId" TEXT PRIMARY KEY,
  "subjectId" TEXT NOT NULL REFERENCES auth_subjects(id),
  "digest" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "securityRevision" TEXT NOT NULL,
  "issuedAt" INTEGER NOT NULL,
  "expiresAt" INTEGER NOT NULL,
  "absoluteExpiresAt" INTEGER NOT NULL,
  "assurance" TEXT NOT NULL,
  "claims" TEXT NOT NULL,
  "provenance" TEXT NOT NULL,
  "credentialVersion" TEXT NOT NULL
);

CREATE UNIQUE INDEX auth_sessions_digest ON auth_sessions (digest);

CREATE TABLE auth_flows (
  "flowId" TEXT PRIMARY KEY,
  "subjectId" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "pendingDigest" TEXT,
  "dedupUntil" INTEGER NOT NULL
);
