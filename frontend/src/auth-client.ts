import { Client } from "@yielded/auth";
import { AuthContract } from "../../backend/auth-contract.ts";

const definition = (origin: string) => Client.make(AuthContract, { baseUrl: origin });

/** Stable client service key; the entry point supplies the actual browser origin. */
export const AuthClient = definition("http://localhost:1339");

/** Acquire one scoped client at the browser composition root, including CSRF and credential fencing. */
export const authClientLayer = (origin: string) => definition(origin).layerFetch;
