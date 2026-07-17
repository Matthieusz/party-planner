import * as Schema from "effect/Schema";

/** Identifies a Venue, the unit of business-data isolation. */
export const VenueId = Schema.NonEmptyString.pipe(Schema.brand("VenueId"));
export type VenueId = typeof VenueId.Type;

/** Identifies a Staff member within a Venue. */
export const StaffId = Schema.NonEmptyString.pipe(Schema.brand("StaffId"));
export type StaffId = typeof StaffId.Type;

/** Identifies a persisted Function, called a Session in the UI. */
export const FunctionId = Schema.NonEmptyString.pipe(
  Schema.brand("FunctionId")
);
export type FunctionId = typeof FunctionId.Type;

/** The single permission bundle assigned to a Staff member. */
export const StaffRole = Schema.Literals([
  "admin",
  "coordinator",
  "kitchen",
  "service",
]);
export type StaffRole = typeof StaffRole.Type;

/** Persisted and effective lifecycle states for a Session. */
export const SessionStatus = Schema.Literals([
  "scheduled",
  "active",
  "completed",
  "cancelled",
]);
export type SessionStatus = typeof SessionStatus.Type;

/** Authenticated Staff context supplied to Session application operations. */
export const StaffContext = Schema.Struct({
  id: StaffId,
  role: StaffRole,
  venueId: VenueId,
});
export type StaffContext = typeof StaffContext.Type;

/** A venue-scoped operational Session read model. Times are Unix milliseconds. */
export const Session = Schema.Struct({
  endsAt: Schema.Number,
  id: FunctionId,
  name: Schema.NonEmptyString,
  startsAt: Schema.Number,
  status: SessionStatus,
  venueId: VenueId,
});
export type Session = typeof Session.Type;

/** Input for reading one Session in the active Venue. */
export const GetSessionInput = Schema.Struct({
  id: FunctionId,
  staff: StaffContext,
});
export type GetSessionInput = typeof GetSessionInput.Type;

/** Derives the effective Session status according to ADR-0005. */
export const currentStatus = (session: Session, now: number): SessionStatus => {
  if (session.status === "cancelled" || session.status === "completed") {
    return session.status;
  }
  if (now >= session.endsAt) {
    return "completed";
  }
  if (now >= session.startsAt) {
    return "active";
  }
  return "scheduled";
};
