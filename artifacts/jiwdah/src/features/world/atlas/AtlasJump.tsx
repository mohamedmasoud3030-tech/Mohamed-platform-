import { useId, useMemo, useRef, useState } from "react";
import type { WorldGraph } from "@/graph";
import type { AppLocale } from "@/providers/preferences";
import { ATLAS_COPY, ATLAS_TEST_IDS, ATLAS_TYPE_LABELS, atlasNodeKey } from "./selectors";
import { atlasJumpSearch, buildAtlasJumpIndex, type AtlasJumpResult } from "./jump";

export interface AtlasJumpProps {
  graph: WorldGraph;
  locale: AppLocale;
  onSelect: (id: string) => void;
}

/**
 * Atlas jump — a local index over the graph, nothing more.
 *
 * It searches structural names (worlds, chambers, operations, shared roots) and
 * moves Atlas focus. It never queries the API, never navigates the product, and
 * never competes with global search, because there is no global search to
 * compete with: LENA's public surfaces are spatial, and this is wayfinding
 * inside one of them.
 */
export function AtlasJump({ graph, locale, onSelect }: AtlasJumpProps) {
  const ar = locale === "ar";
  const listId = useId();
  const index = useMemo(() => buildAtlasJumpIndex(graph), [graph]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results: AtlasJumpResult[] = useMemo(() => atlasJumpSearch(index, graph, query), [index, graph, query]);
  const showList = open && query.trim().length >= 2;

  const commit = (result: AtlasJumpResult | undefined) => {
    if (!result) return;
    onSelect(result.node.id);
    setQuery("");
    setOpen(false);
    setActive(0);
    inputRef.current?.blur();
  };

  return (
    <div className="lena-atlas-jump" id={ATLAS_TEST_IDS.jump}>
      <label htmlFor={`${listId}-input`}>{ATLAS_COPY.jump[locale]}</label>
      <input
        ref={inputRef}
        id={`${listId}-input`}
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={`${listId}-list`}
        aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? `${listId}-item-${active}` : undefined}
        autoComplete="off"
        value={query}
        placeholder={ATLAS_COPY.jumpPlaceholder[locale]}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            return;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
            return;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((current) => Math.max(current - 1, 0));
            return;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            commit(results[active]);
          }
        }}
      />
      {showList ? (
        <ul id={`${listId}-list`} role="listbox" aria-label={ar ? "نتائج الأطلس" : "Atlas results"}>
          {results.length === 0 ? (
            <li className="lena-atlas-jump-empty" role="presentation">
              {ATLAS_COPY.jumpEmpty[locale]}
            </li>
          ) : (
            results.map((result, index) => (
              <li key={result.node.id}>
                <button
                  type="button"
                  id={`${listId}-item-${index}`}
                  role="option"
                  aria-selected={index === active}
                  data-atlas-jump-result={result.node.id}
                  data-atlas-jump-key={atlasNodeKey(result.node.id)}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(event) => {
                    // mousedown beats blur, so the click is not lost to closing.
                    event.preventDefault();
                    commit(result);
                  }}
                >
                  <span className="lena-atlas-jump-kind">{ATLAS_TYPE_LABELS[result.node.type][locale]}</span>
                  <span className="lena-atlas-jump-name">{result.node.label[locale]}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
