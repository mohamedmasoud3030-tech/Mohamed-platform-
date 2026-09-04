import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(ROOT, path), "utf8");

const systems = read("artifacts/lena/src/content/systems.ts");
const primitives = read(
  "artifacts/lena/src/features/world/content/operating-primitives.ts",
);
const graph = read(
  "artifacts/lena/src/features/world/components/ConstellationGraph.tsx",
);
const worldPage = read("artifacts/lena/src/pages/World.tsx");
const atlasPage = read("artifacts/lena/src/pages/WorldAtlas.tsx");
const css = read("artifacts/lena/src/styles/world-graph.css");
const lenaCss = read("artifacts/lena/src/lena.css");

let failures = 0;
const check = (name, fn) => {
  try {
    fn();
    console.log(`  PASS  ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`  FAIL  ${name}\n        ${error.message}`);
  }
};

console.log("\n== LENA World v6 Constellation Graph contract ==");

check(
  "all six canonical systems explicitly declare their operating roots",
  () => {
    for (const id of [
      "property",
      "wellness",
      "rental",
      "investment",
      "hospitality",
      "recycling",
    ]) {
      assert.match(
        systems,
        new RegExp(
          `id: "${id}"[\\s\\S]*?operatingPrimitives: \\[[^\\]]+\\]`,
        ),
        `${id} operating roots missing`,
      );
    }
  },
);

check(
  "graph edges are derived from explicit ids, never inferred from translated copy",
  () => {
    assert.match(
      primitives,
      /system\.operatingPrimitives\.includes\(primitive\.id\)/,
    );
    assert.doesNotMatch(
      primitives,
      /\.does\[|\.usage\[|\.problem\[|\.includes\(.*label/,
    );
    assert.match(graph, /roots\.flatMap\(\(root\)/);
    assert.match(graph, /root\.systemIds\.map\(\(systemId\)/);
  },
);

check(
  "only repetition across two or more systems is promoted to a shared root",
  () => {
    assert.match(
      primitives,
      /const maturity:[\s\S]*?systemIds\.length >= 2 \? "shared" : "signal"/,
    );
    assert.match(graph, /is-\$\{root\.maturity\}/);
    assert.match(css, /\.lena-os-root\.is-signal/);
  },
);

check(
  "Atlas owns the complete canonical public family and shared-root graph",
  () => {
    assert.doesNotMatch(worldPage, /ConstellationGraph/);
    assert.match(
      atlasPage,
      /import \{ publicSystems \} from "@\/content\/systems"/,
    );
    assert.match(
      atlasPage,
      /const systems = useMemo\(\(\) => publicSystems\(\), \[\]\)/,
    );
    assert.match(
      atlasPage,
      /<ConstellationGraph systems=\{systems\} locale=\{locale\} \/>/,
    );
  },
);

check(
  "the OS boundary is explicit and does not claim shared infrastructure exists",
  () => {
    assert.match(graph, /لا تُقدَّم بعد كقدرة مشتركة/);
    assert.match(
      graph,
      /does not claim the products already share one platform/,
    );
    assert.match(graph, /without weakening each system's specialization/);
  },
);

check(
  "graph relationships are keyboard-readable and have a mobile composition",
  () => {
    assert.match(graph, /aria-pressed=\{selected\}/);
    assert.match(graph, /aria-live="polite"/);
    assert.match(graph, /className="lena-os-mobile-roots"/);
    assert.match(
      css,
      /@media \(max-width: 720px\)[\s\S]*\.lena-os-graph-stage\s*\{\s*display:\s*none;/,
    );
    assert.match(
      css,
      /\.lena-os-root-grid[\s\S]*grid-template-columns: repeat\(2/,
    );
  },
);

check(
  "continuous signal motion pauses offscreen and disappears under reduced motion",
  () => {
    assert.match(css, /\.lena-os-reveal\.is-away \.lena-os-edges line/);
    assert.match(css, /animation-play-state: paused/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
    assert.match(css, /animation: none !important/);
  },
);

check(
  "World v6 visual language loads after the Inner Constellation layer",
  () => {
    const inner = lenaCss.indexOf('@import "./styles/world-inner.css"');
    const graphIndex = lenaCss.indexOf('@import "./styles/world-graph.css"');
    assert.ok(inner >= 0, "world-inner.css import missing");
    assert.ok(
      graphIndex > inner,
      "world-graph.css must load after world-inner.css",
    );
  },
);

console.log(
  failures === 0 ? "\nALL CHECKS PASSED\n" : `\n${failures} FAILED\n`,
);
process.exit(failures ? 1 : 0);
