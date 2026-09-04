import type { WorldGraphNode } from "@/graph";
import type { AppLocale } from "@/providers/preferences";
import { ATLAS_TEST_IDS, ATLAS_TYPE_LABELS, atlasNodeKey } from "./selectors";
import type { AtlasPlacedNode } from "./layout";

export interface AtlasNodeProps {
  node: WorldGraphNode;
  /** Null in stepwise mode, where placement is structural order, not geometry. */
  placed: AtlasPlacedNode | null;
  locale: AppLocale;
  /** The node currently at the center of the scene. */
  isCenter: boolean;
  isSelected: boolean;
  /** Whether committing to this node would move the visitor. */
  navigable: boolean;
  onSelect: (id: string) => void;
  /** Canonical world presence, read from the existing World Intelligence API. */
  presence?: string | null;
  /** Structural counts, derived from the graph — never decorative. */
  counts?: { children: number; sharedRoots: number };
  variant?: "field" | "stepwise";
  /** Structural rank for stepwise mode, where there is no placement. */
  rank?: string;
}

/**
 * One Atlas node.
 *
 * A real button, so keyboard, screen readers and hit targets behave like the
 * rest of LENA. Every structural cue it needs is available as *text*: type,
 * depth rank and child count. Position and color are emphasis, never the only
 * carriers of meaning.
 */
export function AtlasNode({
  node,
  placed,
  locale,
  isCenter,
  isSelected,
  navigable,
  onSelect,
  presence,
  counts,
  variant = "field",
  rank,
}: AtlasNodeProps) {
  const ar = locale === "ar";
  const typeLabel = ATLAS_TYPE_LABELS[node.type][locale];
  const children = counts?.children ?? 0;
  const shared = counts?.sharedRoots ?? 0;

  const description = ar
    ? `${typeLabel}: ${node.label.ar}${navigable ? " — يمكن الدخول إليه" : " — بنية بلا وجهة"}${
        children > 0 ? `، يحتوي ${children}` : ""
      }${shared > 0 ? `، يشترك في ${shared} جذور` : ""}`
    : `${typeLabel}: ${node.label.en}${navigable ? ", navigable" : ", structure without a destination"}${
        children > 0 ? `, contains ${children}` : ""
      }${shared > 0 ? `, shares ${shared} roots` : ""}`;

  const state = placed
    ? ({
        "--atlas-x": `${placed.x}%`,
        "--atlas-y": `${placed.y}%`,
        "--atlas-size": `${placed.size}`,
      } as React.CSSProperties)
    : undefined;

  return (
    <button
      type="button"
      id={ATLAS_TEST_IDS.node(node.id)}
      data-atlas-node-id={node.id}
      data-atlas-node-key={atlasNodeKey(node.id)}
      data-atlas-node-type={node.type}
      data-atlas-node-role={placed?.role ?? "focus"}
      data-atlas-selected={isSelected ? "true" : undefined}
      data-atlas-center={isCenter ? "true" : undefined}
      data-atlas-navigable={navigable ? "true" : undefined}
      aria-pressed={isSelected}
      aria-label={node.label[locale]}
      title={description}
      className={`lena-atlas-node lena-atlas-node--${node.type}${
        isCenter ? " is-center" : ""
      }${isSelected && !isCenter ? " is-selected" : ""}${variant === "stepwise" ? " is-step" : ""}`}
      style={state}
      onClick={() => onSelect(node.id)}
    >
      <span className="lena-atlas-node-rank" aria-hidden="true">
        {placed?.rank ?? rank ?? ""}
      </span>
      <span className="lena-atlas-node-dot" aria-hidden="true" />
      <span className="lena-atlas-node-label">
        <span className="lena-atlas-node-kind">{typeLabel}</span>
        <span className="lena-atlas-node-name">{node.label[locale]}</span>
      </span>
      {presence ? (
        <span className="lena-atlas-node-presence" data-atlas-presence={node.worldId ?? "none"}>
          <i aria-hidden="true" />
          {presence}
        </span>
      ) : null}
      <span className="sr-only">{description}</span>
    </button>
  );
}
