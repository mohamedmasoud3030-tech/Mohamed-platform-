import type { SystemId } from "@/content/systems";

/**
 * Verified product destinations owned by LENA.
 *
 * This is deliberately a connection registry, not a live-status registry.
 * It stores stable product destinations only. Runtime health, customer data,
 * telemetry, and operational signals must never be invented here.
 */
export type ProductConnection = {
  systemId: SystemId;
  productUrl: string;
};

export const PRODUCT_CONNECTIONS: readonly ProductConnection[] = [
  {
    systemId: "property",
    productUrl: "https://malek-plus.vercel.app/",
  },
];

export function productConnectionFor(
  systemId: SystemId,
): ProductConnection | undefined {
  return PRODUCT_CONNECTIONS.find(
    (connection) => connection.systemId === systemId,
  );
}
