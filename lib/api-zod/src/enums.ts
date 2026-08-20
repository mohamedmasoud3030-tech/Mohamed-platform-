/**
 * The delivery pipeline, in the order work actually moves.
 * "qualified" is legacy: kept so historical rows stay valid, never offered as a
 * choice. See lib/db/drizzle/0011_lena_delivery_lifecycle.sql.
 */
export const INQUIRY_STATUS_VALUES = [
  "new",
  "contacted",
  "quoted",
  "agreed",
  "in_progress",
  "completed",
  "closed",
  "archived",
  "qualified",
] as const;

/** Offered in the interface, in pipeline order. Excludes the legacy value. */
export const INQUIRY_PIPELINE_VALUES = [
  "new",
  "contacted",
  "quoted",
  "agreed",
  "in_progress",
  "completed",
  "closed",
  "archived",
] as const;
export type InquiryStatusValue = (typeof INQUIRY_STATUS_VALUES)[number];

export const PROJECT_STATUS_VALUES = ["draft", "published", "archived"] as const;
export type ProjectStatusValue = (typeof PROJECT_STATUS_VALUES)[number];

export const CONTENT_STATUS_VALUES = ["draft", "published", "archived"] as const;
export type ContentStatusValue = (typeof CONTENT_STATUS_VALUES)[number];

export const ROLE_VALUES = ["user", "admin"] as const;
export type RoleValue = (typeof ROLE_VALUES)[number];
