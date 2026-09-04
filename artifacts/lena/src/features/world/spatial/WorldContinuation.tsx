import type { MouseEvent } from "react";
import { usePreferences } from "@/providers/preferences";
import {
  useSpatialNavigate,
  worldMemory,
  type Continuation,
  type SpatialTargets,
} from "@/lib/spatial";
import { worldRegistry } from "../registry";

/**
 * LENA Continuation Surface — the quiet "continue where you left off" seam.
 *
 * A small affordance, never a "recent pages" widget: it offers the visitor
 * the remembered path and nothing else. The visitor chooses; the world does
 * not move them.
 */
export function useContinueJourney(continuation: Continuation | null) {
  const { go } = useSpatialNavigate();

  return (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (!continuation) return;

    worldMemory.remember({ entryContext: "return" });

    const root = document.querySelector<HTMLElement>(".lena-public");
    const targets = root
      ? ({ root: root as unknown as SpatialTargets["root"] } as SpatialTargets)
      : undefined;

    go(continuation.path, {
      intent: continuation.kind === "chamber" ? "descend" : "enter",
      systemId: continuation.systemId,
      targets,
      markIntroSeen: continuation.kind === "chamber",
    });
  };
}

export default function WorldContinuation({
  continuation,
}: {
  continuation: Continuation;
}) {
  const { locale } = usePreferences();
  const isArabic = locale === "ar";
  const onContinue = useContinueJourney(continuation);

  const systemName = continuation.systemId
    ? worldRegistry.nameFor(continuation.systemId, locale)
    : null;

  const label =
    continuation.kind === "chamber" && systemName
      ? isArabic
        ? `تابع من حيث توقفت — ${systemName}`
        : `Continue where you left off — ${systemName}`
      : isArabic
        ? "تابع رحلتك في عالم LENA"
        : "Resume your journey in LENA World";

  return (
    <a className="lena-continue" href={continuation.path} onClick={onContinue}>
      <span className="lena-continue-dot" aria-hidden="true" />
      <span>{label}</span>
      <span className="lena-continue-arrow" aria-hidden="true">
        {isArabic ? "←" : "→"}
      </span>
    </a>
  );
}
