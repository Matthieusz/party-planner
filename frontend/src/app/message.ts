import { defineMessageUnion } from "foldkit/message";
import { Message as IdentityMessage } from "../identity/message.ts";

/** Routes identity events and command results through the application. */
export const Message = defineMessageUnion({
  GotIdentityMessage: { message: IdentityMessage },
});
/** Application events, including wrapped child events. */
export type Message = typeof Message.Type;
