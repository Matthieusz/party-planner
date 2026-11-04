import { Match, Redacted } from "effect";
import { Submodel } from "foldkit";
import type { Html, HtmlBuilder } from "foldkit/html";
import type { Model } from "./main.ts";
import { Message, passwordInput } from "./message.ts";
import { Alert } from "../components/ui/alert.ts";
import { button } from "../components/ui/button.ts";
import { Card } from "../components/ui/card.ts";
import { input } from "../components/ui/input.ts";
import { spinner } from "../components/ui/spinner.ts";

const loadingView = (label: string, h: HtmlBuilder<Message>): Html =>
  Card(
    {},
    [
      Card.content(
        {},
        [
          h.div(
            [h.Class("flex items-center gap-3 text-muted-foreground")],
            [spinner({}, h), h.p([], [label])],
          ),
        ],
        h,
      ),
    ],
    h,
  );
const failureView = (error: string, h: HtmlBuilder<Message>) =>
  error ? [Alert({ variant: "destructive" }, [Alert.description({}, [error], h)], h)] : [];

const signedOutView = (
  { form, error }: Extract<Model["state"], { readonly _tag: "SignedOut" }>,
  h: HtmlBuilder<Message>,
): Html => {
  const field = (
    id: string,
    label: string,
    type: string,
    value: string,
    onInput: (value: string) => Message,
    autocomplete: string,
  ) =>
    input(
      {
        id,
        name: id,
        label,
        type,
        value,
        onInput,
        attributes: [h.Autocomplete(autocomplete), h.Required(true)],
      },
      h,
    );
  return Card(
    { className: "max-w-md" },
    [
      Card.header(
        {},
        [
          Card.title(
            {},
            [h.h2([], [form.mode === "sign-in" ? "Sign in" : "Create an identity"])],
            h,
          ),
        ],
        h,
      ),
      Card.content(
        { className: "grid gap-5" },
        [
          h.form(
            [h.Class("grid gap-5"), h.OnSubmit(Message.SubmittedAuthForm())],
            [
              ...(form.mode === "sign-up"
                ? [
                    field(
                      "name",
                      "Name",
                      "text",
                      form.name,
                      (value) => Message.UpdatedName({ value }),
                      "name",
                    ),
                  ]
                : []),
              field(
                "email",
                "Email",
                "email",
                form.email,
                (value) => Message.UpdatedEmail({ value }),
                "email",
              ),
              field(
                "password",
                "Password",
                "password",
                Redacted.value(form.password),
                passwordInput,
                form.mode === "sign-in" ? "current-password" : "new-password",
              ),
              button(
                { type: "submit", className: "w-full" },
                form.mode === "sign-in" ? "Sign in" : "Create identity",
                h,
              ),
            ],
          ),
          ...failureView(error, h),
        ],
        h,
      ),
      Card.footer(
        {},
        [
          button(
            {
              type: "button",
              variant: "secondary",
              className: "w-full",
              onClick: Message.SwitchedMode(),
            },
            form.mode === "sign-in" ? "Create an identity" : "Already registered? Sign in",
            h,
          ),
        ],
        h,
      ),
    ],
    h,
  );
};

const signedInView = (error: string, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class("grid gap-5")],
    [
      ...failureView(error, h),
      button(
        { type: "button", variant: "outline", onClick: Message.ClickedSignOut() },
        "Sign out",
        h,
      ),
    ],
  );

/** Authentication forms, request status, and session controls; no application shell. */
export const view = Submodel.defineView<Model, Message>((model, h) =>
  Match.value(model.state).pipe(
    Match.tagsExhaustive({
      Checking: () => loadingView("Checking your session…", h),
      Authenticating: () => loadingView("Verifying your identity…", h),
      SigningOut: () => loadingView("Signing out…", h),
      SignedOut: (state) => signedOutView(state, h),
      SignedIn: ({ error }) => signedInView(error, h),
    }),
  ),
);
