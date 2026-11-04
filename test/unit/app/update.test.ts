import { expect, test } from "vitest";
import { Option } from "effect";
import { init, update } from "../../../frontend/src/app/main.ts";
import { Message } from "../../../frontend/src/app/message.ts";
import { Message as IdentityMessage } from "../../../frontend/src/identity/message.ts";

const identity = { id: "identity-1", name: "Alex", email: "alex@example.com" };

test("application boots with an owned identity check and no operational session", () => {
  const boot = init();
  expect(boot.model.identity.state._tag).toBe("Checking");
  expect(Option.isNone(boot.model.session)).toBe(true);
  expect(boot.commands).toHaveLength(1);
});

test("identity session facts open and close the operational shell", () => {
  const active = update(
    init().model,
    Message.GotIdentityMessage({
      message: IdentityMessage.LoadedIdentity({ identity }),
    }),
  );
  expect(active.model.session).toEqual(Option.some(identity));
  const pending = update(
    active.model,
    Message.GotIdentityMessage({
      message: IdentityMessage.ClickedSignOut(),
    }),
  );
  expect(pending.commands).toHaveLength(1);
  expect(pending.model.session).toEqual(Option.some(identity));
  const failed = update(
    pending.model,
    Message.GotIdentityMessage({
      message: IdentityMessage.FailedRequest({ message: "Server unavailable" }),
    }),
  );
  expect(failed.model.session).toEqual(Option.some(identity));
  const completed = update(
    pending.model,
    Message.GotIdentityMessage({
      message: IdentityMessage.LoadedIdentity({ identity: null }),
    }),
  );
  expect(Option.isNone(completed.model.session)).toBe(true);
  expect(completed.model.identity.state._tag).toBe("SignedOut");
});

test("failed identity verification never opens the operational shell", () => {
  const failed = update(
    init().model,
    Message.GotIdentityMessage({
      message: IdentityMessage.FailedRequest({ message: "Server unavailable" }),
    }),
  );
  expect(Option.isNone(failed.model.session)).toBe(true);
  expect(failed.model.identity.state._tag).toBe("SignedOut");
});
