import { test } from "vitest";
import { Option, Redacted } from "effect";
import { Scene } from "foldkit/test";
import { Authenticate, SignOut } from "../../../frontend/src/identity/commands.ts";
import { init, update, view, type Model } from "../../../frontend/src/app/main.ts";
import { Message as AppMessage } from "../../../frontend/src/app/message.ts";
import { Message } from "../../../frontend/src/identity/message.ts";

const identity = { id: "identity-1", name: "Alex", email: "alex@example.com" };
const signedOut: Model = {
  session: Option.none(),
  identity: {
    state: {
      _tag: "SignedOut",
      error: "",
      form: {
        mode: "sign-in",
        name: "",
        email: "",
        password: Redacted.make(""),
      },
    },
  },
};

test("Foldcn fields preserve labels, native constraints, and sign-in submission", () => {
  Scene.scene(
    { update, view },
    Scene.given(signedOut),
    Scene.expect(Scene.label("Email")).toHaveAttr("required"),
    Scene.expect(Scene.label("Email")).toHaveAttr("autocomplete", "email"),
    Scene.expect(Scene.label("Password")).toHaveAttr("type", "password"),
    Scene.expect(Scene.label("Password")).toHaveAttr("autocomplete", "current-password"),
    Scene.type(Scene.label("Email"), identity.email),
    Scene.type(Scene.label("Password"), "local-password-123"),
    Scene.click(Scene.role("button", { name: "Sign in" })),
    Scene.expect(Scene.text("Verifying your identity…")).toExist(),
    Scene.expect(Scene.role("status", { name: "Loading" })).toExist(),
    Scene.expect(Scene.role("button", { name: "Sign in" })).toBeAbsent(),
    Scene.Command.resolve(Authenticate, Message.FailedRequest({ message: "Sign in failed." })),
    Scene.expect(Scene.role("alert")).toHaveText("Sign in failed."),
  );
});

test("Foldcn mode switch preserves sign-up fields and submission", () => {
  Scene.scene(
    { update, view },
    Scene.given(signedOut),
    Scene.click(Scene.role("button", { name: "Create an identity" })),
    Scene.expect(Scene.role("heading", { name: "Create an identity" })).toExist(),
    Scene.expect(Scene.label("Name")).toHaveAttr("required"),
    Scene.expect(Scene.label("Name")).toHaveAttr("autocomplete", "name"),
    Scene.expect(Scene.label("Password")).toHaveAttr("autocomplete", "new-password"),
    Scene.type(Scene.label("Name"), identity.name),
    Scene.type(Scene.label("Email"), identity.email),
    Scene.type(Scene.label("Password"), "local-password-123"),
    Scene.click(Scene.role("button", { name: "Create identity" })),
    Scene.Command.resolve(Authenticate, Message.LoadedIdentity({ identity })),
    Scene.expect(Scene.role("heading", { name: "Welcome, Alex" })).toExist(),
    Scene.expect(
      Scene.text("Your identity is verified. Venue access is not configured yet."),
    ).toExist(),
    Scene.expect(Scene.role("heading", { name: "Marketing" })).toExist(),
    Scene.expect(Scene.role("heading", { name: "Kitchen" })).toExist(),
    Scene.expect(Scene.role("heading", { name: "Service" })).toExist(),
    Scene.expectAll(Scene.all.selector("section p")).toHaveCount(3),
  );
});

test("Foldcn sign-out keeps the verified identity when the server fails", () => {
  Scene.scene(
    { update, view },
    Scene.given(
      update(
        init().model,
        AppMessage.GotIdentityMessage({
          message: Message.LoadedIdentity({ identity }),
        }),
      ).model,
    ),
    Scene.click(Scene.role("button", { name: "Sign out" })),
    Scene.expect(Scene.text("Signing out…")).toExist(),
    Scene.Command.resolve(SignOut, Message.FailedRequest({ message: "Server unavailable" })),
    Scene.expect(Scene.role("heading", { name: "Welcome, Alex" })).toExist(),
    Scene.expect(Scene.role("alert")).toHaveText("Server unavailable"),
    Scene.expect(Scene.role("button", { name: "Sign out" })).toExist(),
  );
});
