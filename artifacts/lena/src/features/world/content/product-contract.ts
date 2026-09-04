import { findSystem, type BusinessSystem, type SystemId } from "@/content/systems";
import type { WorldEntity } from "./world";
import { findWorldEntity } from "./world";
import { evidenceFor, type EvidenceSurface } from "./evidence";
import { productConnectionFor, type ProductConnection } from "./product-connections";

/**
 * The one read-only product contract exposed by LENA World.
 *
 * This is a derived view, not another product registry. `system` is the
 * canonical BusinessSystem record, `world` is the canonical World projection,
 * and evidence/connection values come from their existing authorities. The
 * contract stops at the external product boundary: it does not describe an
 * API, session, customer data, telemetry, or shared authentication.
 */
export type ProductObservationV1 = {
  availability: "unavailable";
  reason: "no-authorized-product-source";
  observedAt: null;
  writable: false;
};

export type ProductHandoffV1 = {
  href: string;
  kind: "external-product";
  opensIn: "new-tab";
  authOwner: "product";
  dataSharing: "none";
};

export type ProductContractV1 = {
  systemId: SystemId;
  /** Direct reference to canonical product truth; no copied BusinessSystem. */
  system: BusinessSystem;
  /** World presentation projection, derived from canonical membership. */
  world: Pick<WorldEntity, "state" | "dna" | "detailPath">;
  /** Real committed evidence only. */
  evidence: readonly EvidenceSurface[];
  /** Verified external destination, or null until one exists. */
  connection: ProductConnection | null;
  /** External handoff/auth boundary, or null until one exists. */
  handoff: ProductHandoffV1 | null;
  /** No product observation is authorized by this read-only tranche. */
  observation: ProductObservationV1;
};

const EMPTY_EVIDENCE: readonly EvidenceSurface[] = [];
const UNAVAILABLE_OBSERVATION: ProductObservationV1 = {
  availability: "unavailable",
  reason: "no-authorized-product-source",
  observedAt: null,
  writable: false,
};

function worldProjection(entity: WorldEntity): ProductContractV1["world"] {
  return {
    state: entity.state,
    dna: entity.dna,
    detailPath: entity.detailPath,
  };
}

/**
 * Derive the v1 contract for a public World product.
 *
 * Hidden systems and unknown ids intentionally return undefined: they are not
 * members of the public World and therefore cannot acquire a public product
 * contract by accident.
 */
export function productContractFor(
  systemId: string | undefined,
): ProductContractV1 | undefined {
  const system = findSystem(systemId);
  const world = findWorldEntity(systemId);
  if (!system || !world) return undefined;

  const connection = productConnectionFor(system.id) ?? null;
  return {
    systemId: system.id,
    system,
    world: worldProjection(world),
    evidence: evidenceFor(system.id) ?? EMPTY_EVIDENCE,
    connection,
    handoff: connection
      ? {
          href: connection.productUrl,
          kind: "external-product",
          opensIn: "new-tab",
          authOwner: "product",
          dataSharing: "none",
        }
      : null,
    observation: UNAVAILABLE_OBSERVATION,
  };
}
