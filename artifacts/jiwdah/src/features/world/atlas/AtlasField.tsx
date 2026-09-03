import { useMemo } from "react";
import type { WorldGraph, WorldGraphNode } from "@/graph";
import { childrenOf, nodeById, pathFromRoot, resolveDestination, sharedRootsOf } from "@/graph";
import type { AppLocale } from "@/providers/preferences";
import { ATLAS_TEST_IDS } from "./selectors";
import type { AtlasFieldLayout } from "./layout";
import { AtlasNode } from "./AtlasNode";

export interface AtlasFieldProps {
  graph: WorldGraph;
  layout: AtlasFieldLayout;
  locale: AppLocale;
  focusId: string | null;
  onSelect: (id: string) => void;
  /** Canonical presence per world, supplied by the page from World Intelligence. */
  presence?: Record<string, string>;
  /** Whether the LENA core artwork should be replaced by a calm focus ring. */
  reducedMotion: boolean;
}

/**
 * Atlas field — the spatial desktop mode.
 *
 * Rings are drawn from the derived layout only; this component owns no graph
 * math and no node list. Relationship intensity is a three-step ramp so the
 * eye reads "what is in focus" before it reads the topology around it.
 */
export function AtlasField({ graph, layout, locale, focusId, onSelect, presence, reducedMotion }: AtlasFieldProps) {
  const placedById = useMemo(() => {
    const map = new Map<string, AtlasFieldLayout["nodes"][number]>();
    for (const node of layout.nodes) map.set(node.id, node);
    return map;
  }, [layout]);

  return (
    <div
      className="lena-atlas-field"
      id={ATLAS_TEST_IDS.field}
      data-atlas-reduced-motion={reducedMotion ? "true" : undefined}
      data-atlas-focused={layout.hasFocus ? "true" : "false"}
    >
      <svg
        className="lena-atlas-diagram"
        viewBox="0 0 100 100"
        role="presentation"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
      >
        <g className="lena-atlas-rings">
          {layout.rings.map((ring) => (
            <circle key={ring.id} className={`lena-atlas-ring lena-atlas-ring--${ring.id}`} cx="50" cy="50" r={ring.radius} />
          ))}
        </g>
        <g className="lena-atlas-links">
          {layout.links.map((link) => (
            <path
              key={link.id}
              className={`lena-atlas-link lena-atlas-link--${link.kind} is-${link.emphasis}`}
              d={link.d}
              fill="none"
              data-atlas-link={link.id}
            />
          ))}
        </g>
      </svg>

      <div className="lena-atlas-nodes">
        {layout.nodes.map((placed) => {
          const node = nodeById(graph, placed.id);
          if (!node) return null;
          return (
            <AtlasNode
              key={placed.id}
              node={node}
              placed={placed}
              locale={locale}
              isCenter={placed.id === layout.focusId}
              isSelected={placed.id === focusId}
              navigable={Boolean(resolveDestination(graph, node.id).path)}
              onSelect={onSelect}
              presence={node.worldId ? presence?.[node.worldId] ?? null : null}
              counts={{
                children: childrenOf(graph, node.id).length,
                sharedRoots: sharedRootsOf(graph, node.id).length,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/** Structural summary for assistive tech, assembled from the query API. */
export function describeAtlasNode(graph: WorldGraph, node: WorldGraphNode, locale: AppLocale): string {
  const labels = pathFromRoot(graph, node.id).map((entry) => entry.label[locale]).filter(Boolean);
  const children = childrenOf(graph, node.id).length;
  const roots = sharedRootsOf(graph, node.id).length;
  return locale === "ar"
    ? `${labels.join(" ← ")} · يحتوي ${children} · جذور مشتركة ${roots}`
    : `${labels.join(" → ")} · contains ${children} · shared roots ${roots}`;
}
