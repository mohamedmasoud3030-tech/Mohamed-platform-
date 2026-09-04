import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Link } from "react-router";
import SeoHead from "@/components/SeoHead";
import { publicSystems } from "@/content/systems";
import ConstellationGraph from "@/features/world/components/ConstellationGraph";
import {
  WORLD_GRAPH_IDS,
  nodeById,
  resolveDestination,
  worldGraph,
  type WorldGraph,
  type WorldGraphNode,
} from "@/graph";
import { AtlasDepth } from "@/features/world/atlas/AtlasDepth";
import { AtlasField } from "@/features/world/atlas/AtlasField";
import { AtlasJump } from "@/features/world/atlas/AtlasJump";
import {
  buildAtlasDepthSequence,
  buildAtlasFieldLayout,
  type AtlasFieldLayout,
} from "@/features/world/atlas/layout";
import {
  ATLAS_COPY,
  ATLAS_ROOT_SELECTOR,
  ATLAS_TEST_IDS,
  ATLAS_TYPE_LABELS,
  atlasNodeKey,
} from "@/features/world/atlas/selectors";
import { presenceLabel } from "@/features/world/atlas/presenceLabel";
import { useSignalRuntime } from "@/features/world/signals";
import { useIsMobile } from "@/hooks/use-mobile";
import PublicShell from "@/layouts/PublicShell";
import { useReducedMotion, useSpatialNavigate, useWorldMemory } from "@/lib/spatial";
import { usePreferences } from "@/providers/preferences";

/**
 * LENA Atlas — the structural map of the whole operating world.
 *
 * Atlas is a place, not an admin surface. It answers one question well: *what
 * contains what, and how do I get there?* Every node, label, ring and path it
 * shows is derived from the canonical World Graph, which itself derives from the
 * existing registries — so the Atlas cannot drift from the product. Add a world
 * to `content/systems.ts` and it appears here without an Atlas edit.
 *
 * Boundaries it respects:
 *   - navigation is handed to Spatial Continuity (`useSpatialNavigate`), so
 *     browser Back, spatial memory and arrival semantics stay canonical;
 *   - world presence is read from World Intelligence through its public view,
 *     never recomputed here;
 *   - focus is in-scene: no modal card, and no second Command page.
 */
export default function WorldAtlas() {
  const { locale } = usePreferences();
  const ar = locale === "ar";
  const graph = worldGraph();
  const systems = useMemo(() => publicSystems(), []);
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  const memory = useWorldMemory();
  const { go } = useSpatialNavigate();
  const { presence } = useSignalRuntime();

  /** Where the visitor enters: the world they last stood in, if the graph still
   *  knows it. A remembered system that no longer exists yields no focus — the
   *  same rule the canonical continuation resolver follows. The graph index is
   *  the check: it is derived from the very registry  reads, so
   *  Atlas never needs a second membership test. */
  const initialFocusId = useMemo(() => {
    const remembered = memory?.lastSystemId ?? null;
    if (!remembered) return null;
    return graph.nodesById.has(WORLD_GRAPH_IDS.world(remembered))
      ? WORLD_GRAPH_IDS.world(remembered)
      : null;
  }, [graph, memory]);

  const [focusId, setFocusId] = useState<string | null>(initialFocusId);
  const sceneRef = useRef<HTMLDivElement | null>(null);

  const layout = useMemo(
    () => buildAtlasFieldLayout(graph, { focusId, mode: isMobile ? "stepwise" : "field" }),
    [graph, focusId, isMobile],
  );
  const sequence = useMemo(() => buildAtlasDepthSequence(graph, focusId, locale), [graph, focusId, locale]);
  const focusNode: WorldGraphNode = nodeById(graph, layout.focusId) ?? nodeById(graph, graph.rootId)!;

  const handleSelect = useCallback((id: string) => {
    // Selecting the center again releases focus back to the whole field.
    setFocusId((current) => (current === id ? null : id));
  }, []);

  /** The navigation seam: a graph destination handed to the existing spatial
   *  layer. Atlas never calls the router directly. */
  const handleEnter = useCallback(
    (node: WorldGraphNode) => {
      const destination = resolveDestination(graph, node.id);
      if (!destination.path) return;
      go(destination.path, { intent: destination.intent, systemId: node.systemId });
    },
    [go, graph],
  );

  /** Move DOM focus to a node after the scene has re-rendered around it. */
  const focusNodeButton = useCallback((id: string) => {
    queueMicrotask(() => {
      const buttons = sceneRef.current?.querySelectorAll<HTMLButtonElement>("[data-atlas-node-id]");
      for (const button of buttons ?? []) {
        if (button.dataset.atlasNodeId === id) {
          button.focus();
          return;
        }
      }
    });
  }, []);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const container = sceneRef.current;
      if (!container) return;
      const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>("[data-atlas-node-id]"));
      if (buttons.length === 0) return;
      const activeId =
        document.activeElement instanceof HTMLElement ? document.activeElement.dataset.atlasNodeId : undefined;
      const activeIndex = activeId ? buttons.findIndex((button) => button.dataset.atlasNodeId === activeId) : -1;

      if (event.key === "Escape") {
        setFocusId(null);
        buttons[0]?.focus();
        return;
      }

      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        const step = event.key === "ArrowRight" ? 1 : -1;
        const next = activeIndex === -1 ? 0 : (activeIndex + step + buttons.length) % buttons.length;
        buttons[next]?.focus();
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        const anchor = nodeById(graph, activeId ?? layout.focusId);
        if (!anchor) return;
        event.preventDefault();
        if (event.key === "ArrowDown") {
          const child = layout.nodes.find((placed) => nodeById(graph, placed.id)?.parentId === anchor.id);
          if (child) {
            setFocusId(child.id);
            focusNodeButton(child.id);
          }
          return;
        }
        if (anchor.parentId) {
          setFocusId(anchor.parentId);
          focusNodeButton(anchor.parentId);
        }
      }
    },
    [focusNodeButton, graph, layout.focusId, layout.nodes],
  );

  const worldPresence = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [systemId, value] of Object.entries(presence ?? {})) {
      const label = presenceLabel(value, locale);
      if (label) map[systemId] = label;
    }
    return map;
  }, [presence, locale]);

  const counts = {
    worlds: graph.nodes.filter((node) => node.type === "world").length,
    chambers: graph.nodes.filter((node) => node.type === "chamber").length,
    operations: graph.nodes.filter((node) => node.type === "operation").length,
    roots: graph.nodes.filter((node) => node.type === "capability").length,
  };

  return (
    <PublicShell>
      <SeoHead
        title={ar ? "أطلس LENA — بنية العالم" : "LENA Atlas — the structure of the world"}
        description={ATLAS_COPY.intro[locale]}
        path="/world/atlas"
      />

      <div
        className={`${ATLAS_ROOT_SELECTOR.slice(1)}${focusNode.meta.dna ? ` dna-${focusNode.meta.dna}` : ""}`}
        data-atlas-mode={isMobile ? "stepwise" : "field"}
        data-atlas-state={focusNode.meta.state ?? "field"}
      >
        <header className="lena-atlas-head">
          <p className="lena-kicker">{ATLAS_COPY.kicker[locale]}</p>
          <h1>{ATLAS_COPY.title[locale]}</h1>
          <p className="lena-atlas-intro">{ATLAS_COPY.intro[locale]}</p>
          <p className="lena-atlas-counts">
            {ar
              ? `${counts.worlds} عوالم · ${counts.chambers} غرف · ${counts.operations} عمليات · ${counts.roots} جذور مشتركة`
              : `${counts.worlds} worlds · ${counts.chambers} chambers · ${counts.operations} operations · ${counts.roots} shared roots`}
          </p>
        </header>

        <div className="lena-atlas-toolbar">
          <p className="lena-atlas-context" id={ATLAS_TEST_IDS.context} aria-live="polite">
            <span className="lena-atlas-context-kind">
              {focusNode.id === graph.rootId ? ATLAS_COPY.field[locale] : ATLAS_TYPE_LABELS[focusNode.type][locale]}
            </span>
            {/* The trail is the Graph query output, not a separate breadcrumb. */}
            <span className="lena-atlas-context-trail">{sequence.trail.join(ar ? " ← " : " → ")}</span>
          </p>
          <AtlasJump graph={graph} locale={locale} onSelect={(id) => setFocusId(id)} />
          <button type="button" className="lena-atlas-clear" onClick={() => setFocusId(null)}>
            {ATLAS_COPY.clear[locale]}
          </button>
        </div>

        <div className="lena-atlas-scene" ref={sceneRef} onKeyDown={handleKeyDown}>
          {isMobile ? (
            <AtlasDepth
              graph={graph}
              sequence={sequence}
              locale={locale}
              focusId={focusId}
              onSelect={handleSelect}
              onEnter={handleEnter}
              presence={worldPresence}
            />
          ) : (
            <>
              <AtlasField
                graph={graph}
                layout={layout}
                locale={locale}
                focusId={focusId}
                onSelect={handleSelect}
                presence={worldPresence}
                reducedMotion={reduced}
              />
              <aside className="lena-atlas-panel" id={ATLAS_TEST_IDS.focusPanel} aria-label={ATLAS_COPY.focus[locale]}>
                <AtlasPanelBody
                  focusNode={focusNode}
                  layout={layout}
                  graph={graph}
                  locale={locale}
                  onSelect={handleSelect}
                  onEnter={handleEnter}
                />
              </aside>
            </>
          )}
        </div>

        <p className="lena-atlas-hint" id={`${ATLAS_TEST_IDS.root}-keys`}>
          {ar
            ? "تنقّل بالأسهم بين العقد، وانزل للأعمق بالسهم السفلي، اصعد بالسهم العلوي، و Esc للخروج من التركيز."
            : "Move between nodes with the arrows, ArrowDown goes deeper, ArrowUp steps out, Escape releases focus."}
        </p>

        <ConstellationGraph systems={systems} locale={locale} />

        <Link className="lena-atlas-exit" id={ATLAS_TEST_IDS.backToWorld} to="/world">
          {ATLAS_COPY.backToWorld[locale]}
        </Link>
      </div>
    </PublicShell>
  );
}

/** In-scene focus: context, containment, relationships, destination. */
function AtlasPanelBody({
  focusNode,
  layout,
  graph,
  locale,
  onSelect,
  onEnter,
}: {
  focusNode: WorldGraphNode;
  layout: AtlasFieldLayout;
  graph: WorldGraph;
  locale: "ar" | "en";
  onSelect: (id: string) => void;
  onEnter: (node: WorldGraphNode) => void;
}) {
  const ar = locale === "ar";
  const destination = resolveDestination(graph, focusNode.id);
  const children = layout.nodes
    .filter((placed) => placed.role === "child")
    .map((placed) => nodeById(graph, placed.id))
    .filter((node): node is WorldGraphNode => Boolean(node));
  const around = layout.nodes
    .filter((placed) => placed.role === "neighbor" || placed.role === "parent")
    .map((placed) => nodeById(graph, placed.id))
    .filter((node): node is WorldGraphNode => Boolean(node));

  return (
    <>
      <p className="lena-atlas-panel-kind">
        {ATLAS_TYPE_LABELS[focusNode.type][locale]}
        {focusNode.meta.dna ? ` · ${focusNode.meta.dna}` : ""}
        {focusNode.meta.state ? ` · ${focusNode.meta.state}` : ""}
      </p>
      <h2>{focusNode.label[locale]}</h2>
      {focusNode.meta.summary ? <p className="lena-atlas-panel-summary">{focusNode.meta.summary[locale]}</p> : null}

      {destination.path ? (
        <button
          type="button"
          className="lena-atlas-destination"
          id={ATLAS_TEST_IDS.destination}
          data-atlas-destination={destination.kind}
          data-atlas-destination-path={destination.path}
          onClick={() => onEnter(focusNode)}
        >
          <span>{ATLAS_COPY.enter[locale]}</span>
          <span className="lena-atlas-destination-path">{destination.path}</span>
          <span aria-hidden="true">{ar ? "←" : "→"}</span>
        </button>
      ) : (
        <p className="lena-atlas-destination is-none" id={ATLAS_TEST_IDS.destination} data-atlas-destination="none">
          {ATLAS_COPY.destinationNone[locale]}
        </p>
      )}

      {children.length > 0 ? (
        <section className="lena-atlas-panel-group">
          <h3>{ATLAS_COPY.children[locale]}</h3>
          <ul>
            {children.map((node) => (
              <li key={node.id}>
                <button
                  type="button"
                  data-atlas-panel-child-key={atlasNodeKey(node.id)}
                  onClick={() => onSelect(node.id)}
                >
                  {node.label[locale]}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {around.length > 0 ? (
        <section className="lena-atlas-panel-group">
          <h3>{ATLAS_COPY.around[locale]}</h3>
          <ul>
            {around.map((node) => (
              <li key={node.id}>
                <button
                  type="button"
                  data-atlas-panel-relative-key={atlasNodeKey(node.id)}
                  onClick={() => onSelect(node.id)}
                >
                  {node.label[locale]}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
