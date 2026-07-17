import type { StaffContext } from "./domain";

/** Decides whether Staff may read a Session in their active Venue. */
export const canReadSession = (
  staff: StaffContext,
  isAssigned: boolean
): boolean => staff.role !== "coordinator" || isAssigned;
