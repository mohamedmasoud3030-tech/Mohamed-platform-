/**
 * Re-export the tRPC router type for client-side type safety.
 * This enables end-to-end type checking between server and client.
 */
export type { AppRouter } from "../../../api-server/src/trpc/router";
