import { Option, Schema } from "effect";
import { Update } from "foldkit";
import type { Document, Html, HtmlBuilder } from "foldkit/html";
import { modifyFields } from "foldkit/struct";
import { AuthenticatedIdentity } from "../../../shared/identity/authenticated-identity.ts";
import * as Identity from "../identity/main.ts";
import { OutMessage as IdentityOutMessage } from "../identity/message.ts";
import { view as identityAuthView } from "../identity/view.ts";
import { Card } from "../components/ui/card.ts";
import { Message } from "./message.ts";

/** Application composition: authentication child and the verified operational session. */
export const Model = Schema.Struct({
  identity: Identity.Model,
  session: Schema.Option(AuthenticatedIdentity),
});
/** Application state; operational features belong alongside identity, not inside it. */
export interface Model extends Schema.Schema.Type<typeof Model> {}

/** Initializes authentication and lifts its session-check command into the application. */
export const init = () =>
  Update.foldChildInit(Identity.init(), {
    toParentModel: (identity): Model => ({ identity, session: Option.none() }),
    toParentMessage: (message) => Message.GotIdentityMessage({ message }),
  });

const foldIdentityOutMessage = IdentityOutMessage.match<Update.Step<Model, Message>>({
  ChangedSession:
    ({ identity }) =>
    (model) => ({
      model: modifyFields(model, { session: () => Option.fromNullishOr(identity) }),
    }),
});

const foldIdentity = Update.foldChild({
  update: Identity.update,
  read: (model: Model) => Option.some(model.identity),
  write: (model, identity) => modifyFields(model, { identity: () => identity }),
  toParentMessage: (message) => Message.GotIdentityMessage({ message }),
  foldOutMessage: foldIdentityOutMessage,
});

/** Delegates child events and handles session facts without inspecting authentication states. */
export const update = (model: Model, message: Message) =>
  Message.match(message, {
    GotIdentityMessage: ({ message }) => foldIdentity(model, message),
  });

const identityView = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.submodel({
    slotId: "identity",
    model: model.identity,
    view: identityAuthView,
    toParentMessage: (message) => Message.GotIdentityMessage({ message }),
  });

const signedInView = (
  model: Model,
  identity: AuthenticatedIdentity,
  h: HtmlBuilder<Message>,
): Html =>
  Card(
    {},
    [
      Card.header(
        {},
        [
          Card.title({}, [h.h2([], [`Welcome, ${identity.name}`])], h),
          Card.description(
            {},
            ["Your identity is verified. Venue access is not configured yet."],
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
            ["Marketing", "Kitchen", "Service"].map((area) =>
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
        ],
        h,
      ),
      Card.footer({}, [identityView(model, h)], h),
    ],
    h,
  );

/** Owns the application document, heading, and operational shell. */
export const view = (model: Model, h: HtmlBuilder<Message>): Document => {
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
        Option.match(model.session, {
          onNone: () => identityView(model, h),
          onSome: (identity) => signedInView(model, identity, h),
        }),
      ],
    ),
  };
};
