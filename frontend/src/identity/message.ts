import { Redacted, Schema } from "effect";
import { defineMessageUnion } from "foldkit/message";
import { AuthenticatedIdentity } from "../../../shared/identity/authenticated-identity.ts";

/** Redacted password schema keeps credentials out of model/message diagnostics. */
export const Password = Schema.Redacted(Schema.String);
/** Closed set of UI events and safe results of owned asynchronous commands. */
export const Message = defineMessageUnion({
  UpdatedName: { value: Schema.String },
  UpdatedEmail: { value: Schema.String },
  UpdatedPassword: { value: Password },
  SwitchedMode: {},
  SubmittedAuthForm: {},
  ClickedSignOut: {},
  LoadedIdentity: { identity: Schema.NullOr(AuthenticatedIdentity) },
  FailedRequest: { message: Schema.String },
});
/** UI event value. */
export type Message = typeof Message.Type;
/** Verified session changes for the application; failed requests emit nothing. */
export const OutMessage = defineMessageUnion({
  ChangedSession: { identity: Schema.NullOr(AuthenticatedIdentity) },
});
/** Facts emitted to the parent application. */
export type OutMessage = typeof OutMessage.Type;

/** Converts password input immediately to a redaction-safe event. */
export const passwordInput = (value: string): Message =>
  Message.UpdatedPassword({ value: Redacted.make(value) });
