import type { WorldGraph, WorldGraphNode } from "@/graph";
import { childrenOf, resolveDestination, sharedRootsOf } from "@/graph";
import type { AppLocale } from "@/providers/preferences";
import { ATLAS_COPY, ATLAS_TEST_IDS, ATLAS_TYPE_LABELS } from "./selectors";
import type { AtlasDepthSequence } from "./layout";
import { AtlasNode } from "./AtlasNode";

export interface AtlasDepthProps {
  graph: WorldGraph;
  sequence: AtlasDepthSequence;
  locale: AppLocale;
  focusId: string | null;
  onSelect: (id: string) => void;
  onEnter: (node: WorldGraphNode) => void;
  presence?: Record<string, string>;
}

/**
 * Atlas depth — the mobile and narrow-viewport mode.
 *
 * Not a shrunk desktop field: one focused node, its parent above it, its
 * children below, and the shared roots that explain it. Stepwise by design, so
 * nothing needs horizontal scrolling, a canvas, or a physics pass on a phone.
 */
export function AtlasDepth({ graph, sequence, locale, focusId, onSelect, onEnter, presence }: AtlasDepthProps) {
  const ar = locale === "ar";
  const { spine, focus } = sequence;

  return (
    <div className="lena-atlas-depth" id={ATLAS_TEST_IDS.stepwise}>
      <nav className="lena-atlas-spine" aria-label={ar ? "المسار البنيوي" : "Structural path"}>
        {spine.map((node, index) => (
          <button
            key={node.id}
            type="button"
            className="lena-atlas-spine-node"
            data-atlas-spine-depth={index}
            onClick={() => onSelect(node.id)}
            aria-current={node.id === focus.id ? "step" : undefined}
          >
            <span className="lena-atlas-spine-kind">{ATLAS_TYPE_LABELS[node.type][locale]}</span>
            <span className="lena-atlas-spine-name">{node.label[locale]}</span>
          </button>
        ))}
      </nav>

      <section className="lena-atlas-focus" id={ATLAS_TEST_IDS.focusPanel} aria-label={ar ? "العقدة المركَّزة" : "Focused node"}>
        <AtlasNode
          node={focus}
          placed={null}
          variant="stepwise"
          rank={String(spine.length - 1).padStart(2, "0")}
          locale={locale}
          isCenter
          isSelected
          navigable={Boolean(resolveDestination(graph, focus.id).path)}
          onSelect={onSelect}
          presence={focus.worldId ? presence?.[focus.worldId] ?? null : null}
          counts={{
            children: childrenOf(graph, focus.id).length,
            sharedRoots: sharedRootsOf(graph, focus.id).length,
          }}
        />
        {focus.meta.summary ? <p className="lena-atlas-focus-summary">{focus.meta.summary[locale]}</p> : null}
        <div className="lena-atlas-focus-actions">
          {focus.parentId ? (
            <button type="button" className="lena-atlas-step" onClick={() => onSelect(focus.parentId!)}>
              <span aria-hidden="true">{ar ? "↓" : "↑"}</span>
              {ATLAS_COPY.stepOut[locale]}
            </button>
          ) : null}
          <AtlasDestinationAction graph={graph} node={focus} locale={locale} onEnter={onEnter} />
        </div>
      </section>

      {sequence.children.length > 0 ? (
        <section className="lena-atlas-group" aria-label={ATLAS_COPY.children[locale]}>
          <h2>{ATLAS_COPY.children[locale]}</h2>
          <ul className="lena-atlas-list">
            {sequence.children.map((node, index) => (
              <li key={node.id}>
                <AtlasNode
                  node={node}
                  placed={null}
                  variant="stepwise"
                  rank={String(index).padStart(2, "0")}
                  locale={locale}
                  isCenter={false}
                  isSelected={node.id === focusId}
                  navigable={Boolean(resolveDestination(graph, node.id).path)}
                  onSelect={onSelect}
                  presence={node.worldId ? presence?.[node.worldId] ?? null : null}
                  counts={{
                    children: childrenOf(graph, node.id).length,
                    sharedRoots: sharedRootsOf(graph, node.id).length,
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {sequence.neighbors.length > 0 ? (
        <section className="lena-atlas-group" aria-label={ATLAS_COPY.around[locale]}>
          <h2>{ATLAS_COPY.around[locale]}</h2>
          <ul className="lena-atlas-list lena-atlas-list--relations">
            {sequence.neighbors.map(({ node, kind }) => (
              <li key={`${node.id}-${kind}`}>
                <button type="button" className="lena-atlas-relation" onClick={() => onSelect(node.id)}>
                  <span className="lena-atlas-relation-kind">{kind.replace(/-/g, " ")}</span>
                  <span className="lena-atlas-relation-name">{node.label[locale]}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/** The seam into existing navigation: a destination, handed upward. */
export function AtlasDestinationAction({
  graph,
  node,
  locale,
  onEnter,
}: {
  graph: WorldGraph;
  node: WorldGraphNode;
  locale: AppLocale;
  onEnter: (node: WorldGraphNode) => void;
}) {
  const destination = resolveDestination(graph, node.id);
  const ar = locale === "ar";
  if (!destination.path) {
    return (
      <p className="lena-atlas-destination" id={ATLAS_TEST_IDS.destination} data-atlas-destination="none">
        {ATLAS_COPY.destinationNone[ar ? "ar" : "en"]}
      </p>
    );
  }
  return (
    <button
      type="button"
      className="lena-atlas-destination"
      id={ATLAS_TEST_IDS.destination}
      data-atlas-destination={destination.kind}
      data-atlas-destination-path={destination.path}
      onClick={() => onEnter(node)}
    >
      <span>{ATLAS_COPY.enter[ar ? "ar" : "en"]}</span>
      <span className="lena-atlas-destination-path">{destination.path}</span>
      <span aria-hidden="true">{ar ? "←" : "→"}</span>
    </button>
  );
}
