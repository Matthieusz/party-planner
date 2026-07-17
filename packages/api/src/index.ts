import { ORPCError, os } from "@orpc/server";

import type { Context } from "./context";

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({
    context: {
      session: context.session,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);

export {
  currentStatus,
  FunctionId,
  GetSessionInput,
  Session,
  SessionStatus,
  StaffContext,
  StaffId,
  StaffRole,
  VenueId,
} from "./session/domain";
export { Forbidden as SessionForbidden } from "./session/forbidden";
export { NotFound as SessionNotFound } from "./session/not-found";
export { SessionRepository } from "./session/repository";
export { sessionServiceLayer, SessionService } from "./session/service";
export { ValidationError as SessionValidationError } from "./session/validation-error";
