/**
 * LENA World registry — the live map of where each system's chamber is.
 *
 * Injected into the continuation resolver so spatial memory can never point
 * at a destination that no longer exists: a remembered system that is not in
 * the canonical world list simply cannot produce a continuation.
 */

import { publicSystems } from "@/content/systems";
import { WORLD_ENTITIES } from "./content/world";

export const worldRegistry = {
  isKnownSystem(systemId: string): boolean {
    return WORLD_ENTITIES.some((entity) => entity.systemId === systemId);
  },
  chamberPathFor(systemId: string): string | null {
    const entity = WORLD_ENTITIES.find((item) => item.systemId === systemId);
    return entity ? entity.detailPath : null;
  },
  nameFor(systemId: string, locale: "ar" | "en"): string | null {
    const system = publicSystems().find((item) => item.id === systemId);
    return system ? system.name[locale] : null;
  },
};
