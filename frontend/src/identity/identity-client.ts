import { Context, Layer } from "effect";

/** Transport for the current session's identity response. */
export class IdentityClient extends Context.Service<
  IdentityClient,
  { readonly get: (signal: AbortSignal) => Promise<Response> }
>()("app/IdentityClient") {}

/** Requests identity from the browser's origin with the current session cookie. */
export const identityClientLayer = Layer.succeed(IdentityClient, {
  get: (signal) => fetch("/api/me", { method: "GET", credentials: "same-origin", signal }),
});
