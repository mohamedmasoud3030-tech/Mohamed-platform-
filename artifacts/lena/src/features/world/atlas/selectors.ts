import type { WorldGraphNodeType } from "@/graph";

/**
 * LENA Atlas — the ownership contract.
 *
 * One place that names what an Atlas surface *is* in the DOM, so the page, its
 * tests and the Guardian route registry never drift apart. The Guardian
 * protects routes by an owner selector; Atlas exposes exactly that selector.
 */
export const ATLAS_ROOT_SELECTOR = ".lena-world-atlas";

/** The stable test/QA hook set. Keep these in sync with routes.config.json. */
export const ATLAS_TEST_IDS = {
  root: "atlas-root",
  field: "atlas-field",
  stepwise: "atlas-stepwise",
  node: (id: string) => `atlas-node:${atlasNodeKey(id)}`,
  focusPanel: "atlas-focus",
  destination: "atlas-destination",
  context: "atlas-context",
  jump: "atlas-jump",
  backToWorld: "atlas-back-to-world",
} as const;

/**
 * A CSS-safe mirror of a structural id.
 *
 * Graph ids contain ":" (`chamber:property`). That is correct for ids and wrong
 * inside attribute selectors, where QA tooling and jsdom both trip over it. So
 * every Atlas element carries this key as well, and it is the documented hook
 * for `[data-atlas-*="..."]` selection.
 */
export function atlasNodeKey(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

/** Node kinds in the visitor's language. Hierarchy must be readable as text. */
export const ATLAS_TYPE_LABELS: Record<WorldGraphNodeType, { ar: string; en: string }> = {
  root: { ar: "الجذر", en: "Root" },
  world: { ar: "عالم", en: "World" },
  chamber: { ar: "غرفة", en: "Chamber" },
  inner: { ar: "فضاء داخلي", en: "Inner space" },
  operation: { ar: "عملية", en: "Operation" },
  capability: { ar: "جذر مشترك", en: "Shared root" },
};

/** Edge verbs, phrased the way LENA describes them in the World. */
export const ATLAS_EDGE_LABELS: Record<string, { ar: string; en: string }> = {
  contains: { ar: "يحتوي", en: "contains" },
  enters: { ar: "يدخل", en: "enters" },
  "leads-to": { ar: "يقود إلى", en: "leads to" },
  "shares-root": { ar: "يشترك في الجذر", en: "shares root" },
  "related-to": { ar: "مرتبط بـ", en: "related to" },
  "belongs-to": { ar: "ينتمي إلى", en: "belongs to" },
};

export const ATLAS_COPY = {
  kicker: { ar: "أطلس عالم LENA", en: "LENA ATLAS" },
  title: { ar: "الأطلس", en: "The Atlas" },
  intro: {
    ar: "البنية الحقيقية لعالم LENA: العوالم، والغرف، والفضاءات الداخلية، والجذور التشغيلية المشتركة بينها.",
    en: "How LENA is actually built: the worlds, their chambers, their inner spaces, and the operating roots they share.",
  },
  hint: {
    ar: "اختر عقدة لتراها داخل سياقها؛ لن تُعرض الشبكة كلها مرة واحدة.",
    en: "Choose a node to see it inside its context — the whole network is never shown at once.",
  },
  jump: { ar: "انتقل إلى", en: "Jump to" },
  jumpPlaceholder: { ar: "نظام، غرفة، عملية، أو جذر", en: "a world, chamber, operation or root" },
  jumpEmpty: { ar: "لا شيء مطابقًا في بنية LENA.", en: "Nothing in LENA's structure matches." },
  enter: { ar: "ادخل", en: "Enter" },
  stepIn: { ar: "انزل أعمق", en: "Go deeper" },
  stepOut: { ar: "اصعد", en: "Step out" },
  clear: { ar: "عرض العوالم", en: "Show the worlds" },
  destinationNone: { ar: "بنية بلا وجهة", en: "Structure without a destination" },
  depth: { ar: "العمق", en: "Depth" },
  children: { ar: "داخل هذا", en: "Inside this" },
  around: { ar: "حول هذا", en: "Around this" },
  field: { ar: "العوالم", en: "Worlds" },
  focus: { ar: "التركيز", en: "Focus" },
  parent: { ar: "الأب", en: "Parent" },
  neighbors: { ar: "جيران", en: "Neighbors" },
  presence: { ar: "حضور", en: "Presence" },
  backToWorld: { ar: "العودة إلى عالم LENA", en: "Back to LENA World" },
} as const;

export const ATLAS_RINGS: Record<string, { ar: string; en: string }> = {
  core: { ar: "التركيز", en: "Focus" },
  depth: { ar: "الداخل", en: "Inside" },
  context: { ar: "السياق", en: "Context" },
  field: { ar: "الحقل", en: "Field" },
};
