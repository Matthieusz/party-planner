import { test } from "vitest";
import { Scene } from "foldkit/test";
import { init, update, view } from "../../../frontend/src/app/main.ts";
import { Message } from "../../../frontend/src/app/message.ts";
import { SignOut } from "../../../frontend/src/identity/commands.ts";
import { Message as IdentityMessage } from "../../../frontend/src/identity/message.ts";

const identity = { id: "identity-1", name: "Alex", email: "alex@example.com" };

test("successful child sign-out returns to authentication without removing the application heading", () => {
  const active = update(
    init().model,
    Message.GotIdentityMessage({ message: IdentityMessage.LoadedIdentity({ identity }) }),
  ).model;
  Scene.scene(
    { update, view },
    Scene.given(active),
    Scene.expect(Scene.role("heading", { name: "Live Operations" })).toExist(),
    Scene.expect(Scene.role("heading", { name: "Welcome, Alex" })).toExist(),
    Scene.click(Scene.role("button", { name: "Sign out" })),
    Scene.expect(Scene.role("button", { name: "Sign out" })).toBeAbsent(),
    Scene.expect(Scene.text("Signing out…")).toExist(),
    Scene.Command.resolve(SignOut, IdentityMessage.LoadedIdentity({ identity: null })),
    Scene.expect(Scene.role("heading", { name: "Live Operations" })).toExist(),
    Scene.expect(Scene.role("heading", { name: "Welcome, Alex" })).toBeAbsent(),
    Scene.expect(Scene.role("heading", { name: "Marketing" })).toBeAbsent(),
    Scene.expect(Scene.role("heading", { name: "Sign in" })).toExist(),
    Scene.expect(Scene.label("Password")).toHaveValue(""),
  );
});
