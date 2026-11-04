import { Match, Redacted, Schema } from "effect";
import { AuthClient } from "./auth-client.ts";
import { IdentityClient } from "./identity-client.ts";
import type { Context } from "effect";
import type { Update } from "foldkit";
import { AuthenticatedIdentity } from "../../../shared/identity/authenticated-identity.ts";
import { Authenticate, CheckIdentity, SignOut } from "./commands.ts";
import { Message, OutMessage, Password } from "./message.ts";

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
  SignedIn: { identity: AuthenticatedIdentity, error: Schema.String },
  SigningOut: { identity: AuthenticatedIdentity },
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
export const init = (): Update.Return<Model, Message, IdentityClient> => ({
  model: { state: State.cases.Checking.make({}) },
  commands: [CheckIdentity()],
});

/** Pure transitions; network work is returned as runtime-owned Commands. */
export const update = (
  model: Model,
  message: Message,
): Update.ReturnWithOutMessage<
  Model,
  Message,
  OutMessage,
  Context.Service.Identifier<typeof AuthClient | typeof IdentityClient>
> =>
  Match.value(message).pipe(
    Match.withReturnType<
      Update.ReturnWithOutMessage<
        Model,
        Message,
        OutMessage,
        Context.Service.Identifier<typeof AuthClient | typeof IdentityClient>
      >
    >(),
    Match.tagsExhaustive({
      UpdatedName: ({ value }) =>
        model.state._tag === "SignedOut"
          ? { model: { state: { ...model.state, form: { ...model.state.form, name: value } } } }
          : { model },
      UpdatedEmail: ({ value }) =>
        model.state._tag === "SignedOut"
          ? { model: { state: { ...model.state, form: { ...model.state.form, email: value } } } }
          : { model },
      UpdatedPassword: ({ value }) =>
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
      SubmittedAuthForm: () =>
        model.state._tag === "SignedOut"
          ? {
              model: { state: State.cases.Authenticating.make({ mode: model.state.form.mode }) },
              commands: [Authenticate(model.state.form)],
            }
          : { model },
      ClickedSignOut: () =>
        model.state._tag === "SignedIn"
          ? {
              model: { state: State.cases.SigningOut.make({ identity: model.state.identity }) },
              commands: [SignOut()],
            }
          : { model },
      LoadedIdentity: ({ identity }) => ({
        outMessage: OutMessage.ChangedSession({ identity }),
        model:
          identity === null
            ? signedOut()
            : { state: State.cases.SignedIn.make({ identity, error: "" }) },
      }),
      FailedRequest: ({ message: error }) => ({
        model:
          model.state._tag === "SigningOut"
            ? { state: State.cases.SignedIn.make({ identity: model.state.identity, error }) }
            : signedOut(error),
      }),
    }),
  );
