import { Redacted, Schema } from "effect";
import { defineMessageUnion } from "foldkit/message";
import { TeamMember } from "../../../shared/identity/team-member.ts";

/** Redacted password schema keeps credentials out of model/message diagnostics. */
export const Password = Schema.Redacted(Schema.String);
/** Closed set of UI events and safe results of owned asynchronous commands. */
export const Message = defineMessageUnion({
  ChangedName: { value: Schema.String },
  ChangedEmail: { value: Schema.String },
  ChangedPassword: { value: Password },
  SwitchedMode: {},
  Submitted: {},
  RequestedSignOut: {},
  LoadedIdentity: { member: Schema.NullOr(TeamMember) },
  FailedRequest: { message: Schema.String },
});
/** UI event value. */
export type Message = typeof Message.Type;
/** Converts password input immediately to a redaction-safe event. */
export const passwordInput = (value: string): Message =>
  Message.ChangedPassword({ value: Redacted.make(value) });
