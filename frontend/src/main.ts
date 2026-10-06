import { Match, Redacted, Schema } from "effect";
import { AuthClient } from "./auth-client.ts";
import type { Context } from "effect";
import type { Runtime, Update } from "foldkit";
import type { Document, HtmlBuilder } from "foldkit/html";
import { TeamMember } from "../../backend/current-team-member.ts";
import { Authenticate, CheckIdentity, SignOut } from "./commands.ts";
import { Message, Password, passwordInput } from "./message.ts";
import { Alert } from "./components/ui/alert.ts";
import { button } from "./components/ui/button.ts";
import { Card } from "./components/ui/card.ts";
import { input } from "./components/ui/input.ts";
import { spinner } from "./components/ui/spinner.ts";

const Form = Schema.Struct({
  mode: Schema.Literals(["sign-in", "sign-up"]),
  name: Schema.String,
  email: Schema.String,
  password: Password,
});
const State = Schema.TaggedUnion({
  Checking: {},
  SignedOut: { form: Form, error: Schema.String },
  Authenticating: { mode: Form.fields.mode },
  SignedIn: { member: TeamMember, error: Schema.String },
  SigningOut: { member: TeamMember },
});

/** Authentication state machine; pending states cannot submit duplicate work. */
export const Model = Schema.Struct({ state: State });
/** UI model, containing no session tokens and only redacted passwords. */
export interface Model extends Schema.Schema.Type<typeof Model> {}

const signedOut = (error = ""): Model => ({
  state: State.cases.SignedOut.make({
    form: { mode: "sign-in", name: "", email: "", password: Redacted.make("") },
    error,
  }),
});

/** Starts by verifying the server session through a protected endpoint. */
export const init: Runtime.ApplicationInit<Model, Message> = () => ({
  model: { state: State.cases.Checking.make({}) },
  commands: [CheckIdentity()],
});

/** Pure transitions; network work is returned as runtime-owned Commands. */
export const update = (
  model: Model,
  message: Message,
): Update.Return<Model, Message, Context.Service.Identifier<typeof AuthClient>> =>
  Match.value(message).pipe(
    Match.withReturnType<
      Update.Return<Model, Message, Context.Service.Identifier<typeof AuthClient>>
    >(),
    Match.tagsExhaustive({
      ChangedName: ({ value }) =>
        model.state._tag === "SignedOut"
          ? { model: { state: { ...model.state, form: { ...model.state.form, name: value } } } }
          : { model },
      ChangedEmail: ({ value }) =>
        model.state._tag === "SignedOut"
          ? { model: { state: { ...model.state, form: { ...model.state.form, email: value } } } }
          : { model },
      ChangedPassword: ({ value }) =>
        model.state._tag === "SignedOut"
          ? { model: { state: { ...model.state, form: { ...model.state.form, password: value } } } }
          : { model },
      SwitchedMode: () =>
        model.state._tag === "SignedOut"
          ? {
              model: {
                state: {
                  ...model.state,
                  error: "",
                  form: {
                    ...model.state.form,
                    mode: model.state.form.mode === "sign-in" ? "sign-up" : "sign-in",
                    password: Redacted.make(""),
                  },
                },
              },
            }
          : { model },
      Submitted: () =>
        model.state._tag === "SignedOut"
          ? {
              model: { state: State.cases.Authenticating.make({ mode: model.state.form.mode }) },
              commands: [Authenticate(model.state.form)],
            }
          : { model },
      RequestedSignOut: () =>
        model.state._tag === "SignedIn"
          ? {
              model: { state: State.cases.SigningOut.make({ member: model.state.member }) },
              commands: [SignOut()],
            }
          : { model },
      LoadedIdentity: ({ member }) => ({
        model:
          member === null
            ? signedOut()
            : { state: State.cases.SignedIn.make({ member, error: "" }) },
      }),
      FailedRequest: ({ message: error }) => ({
        model:
          model.state._tag === "SigningOut"
            ? { state: State.cases.SignedIn.make({ member: model.state.member, error }) }
            : signedOut(error),
      }),
    }),
  );

/** Live Operations shell; organization/venue permissions are deliberately not implied. */
export const view = (model: Model, h: HtmlBuilder<Message>): Document => {
  const loading = (label: string) =>
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
  const failure = (error: string) =>
    error ? [Alert({ variant: "destructive" }, [Alert.description({}, [error], h)], h)] : [];
  const contents = State.match(model.state, {
    Checking: () => loading("Checking your session…"),
    Authenticating: () => loading("Verifying your identity…"),
    SigningOut: () => loading("Signing out…"),
    SignedOut: ({ form, error }) => {
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
                [h.h2([], [form.mode === "sign-in" ? "Sign in" : "Join as a Team Member"])],
                h,
              ),
            ],
            h,
          ),
          Card.content(
            { className: "grid gap-5" },
            [
              h.form(
                [h.Class("grid gap-5"), h.OnSubmit(Message.Submitted())],
                [
                  ...(form.mode === "sign-up"
                    ? [
                        field(
                          "name",
                          "Name",
                          "text",
                          form.name,
                          (value) => Message.ChangedName({ value }),
                          "name",
                        ),
                      ]
                    : []),
                  field(
                    "email",
                    "Email",
                    "email",
                    form.email,
                    (value) => Message.ChangedEmail({ value }),
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
              ...failure(error),
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
    },
    SignedIn: ({ member, error }) =>
      Card(
        {},
        [
          Card.header(
            {},
            [
              Card.title({}, [h.h2([], [`Welcome, ${member.name}`])], h),
              Card.description(
                {},
                [
                  "Your individual identity is verified. Organization and Venue access is not configured yet.",
                ],
                h,
              ),
            ],
            h,
          ),
          Card.content(
            { className: "grid gap-5" },
            [
              h.div(
                [h.Class("grid gap-4 sm:grid-cols-3")],
                ["Management", "Kitchen", "Service"].map((area) =>
                  h.section(
                    [],
                    [
                      Card(
                        { size: "sm", className: "h-full bg-muted/50" },
                        [
                          Card.header({}, [Card.title({}, [h.h3([], [area])], h)], h),
                          Card.content(
                            {},
                            [h.p([h.Class("text-muted-foreground")], ["No Venue selected."])],
                            h,
                          ),
                        ],
                        h,
                      ),
                    ],
                  ),
                ),
              ),
              ...failure(error),
            ],
            h,
          ),
          Card.footer(
            {},
            [
              button(
                { type: "button", variant: "outline", onClick: Message.RequestedSignOut() },
                "Sign out",
                h,
              ),
            ],
            h,
          ),
        ],
        h,
      ),
  });
  return {
    title: "Live Operations",
    body: h.main(
      [h.Class("mx-auto max-w-5xl px-6 py-16")],
      [
        h.header(
          [h.Class("mb-8")],
          [
            h.p(
              [h.Class("text-xs uppercase tracking-widest text-muted-foreground")],
              ["Venue Operations"],
            ),
            h.h1(
              [h.Class("mt-2 text-4xl font-semibold tracking-tight sm:text-5xl")],
              ["Live Operations"],
            ),
          ],
        ),
        contents,
      ],
    ),
  };
};
