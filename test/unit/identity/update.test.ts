import { expect, test } from "vitest";
import { Redacted } from "effect";
import { update, type Model } from "../../../frontend/src/identity/main.ts";
import { Message, passwordInput } from "../../../frontend/src/identity/message.ts";

const identity = { id: "identity-1", name: "Alex", email: "alex@example.com" };
const signedOut = (): Model =>
  update({ state: { _tag: "Checking" } }, Message.LoadedIdentity({ identity: null })).model;

test("passwords are redacted at the input boundary", () => {
  const event = passwordInput("secret-password");
  expect(JSON.stringify(event)).not.toContain("secret-password");
  const changed = update(signedOut(), event).model;
  if (changed.state._tag !== "SignedOut") throw new Error("Expected SignedOut");
  expect(Redacted.value(changed.state.form.password)).toBe("secret-password");
});

test("submitting emits one owned command and removes the password from the model", () => {
  const filled = update(signedOut(), passwordInput("secret-password")).model;
  const submitted = update(filled, Message.SubmittedAuthForm());
  expect(submitted.model.state._tag).toBe("Authenticating");
  expect(submitted.commands).toHaveLength(1);
  expect(JSON.stringify(submitted.model)).not.toContain("secret-password");
  expect(update(submitted.model, Message.SubmittedAuthForm()).commands).toBeUndefined();
});

test("a server identity is required to enter Live Operations", () => {
  const result = update(signedOut(), Message.LoadedIdentity({ identity }));
  expect(result.model.state).toEqual({ _tag: "SignedIn", identity, error: "" });
});

test("failed sign-out does not claim that the server session has ended", () => {
  const active: Model = { state: { _tag: "SignedIn", identity, error: "" } };
  const pending = update(active, Message.ClickedSignOut());
  expect(pending.model.state._tag).toBe("SigningOut");
  expect(pending.commands).toHaveLength(1);
  const failed = update(pending.model, Message.FailedRequest({ message: "Server unavailable" }));
  expect(failed.model.state).toEqual({ _tag: "SignedIn", identity, error: "Server unavailable" });
  const completed = update(pending.model, Message.LoadedIdentity({ identity: null }));
  expect(completed.model.state._tag).toBe("SignedOut");
});
