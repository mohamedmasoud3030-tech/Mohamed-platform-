import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import SeoHead from "@/components/SeoHead";
import { pageSeo } from "@/content/seo";
import PublicShell from "@/layouts/PublicShell";
import { usePreferences } from "@/providers/preferences";
import WorldScene from "@/features/world/components/WorldScene";
import { WORLD_ENTITIES, worldEntities, worldSystem } from "@/features/world/content/world";
import { useWorldPortalTransition } from "@/features/world/WorldPortalTransition";
import { worldRegistry } from "@/features/world/registry";
import {
  spatialRuntime,
  useSpatialContext,
  useSpatialNavigate,
  useWorldMemory,
  worldMemory,
} from "@/lib/spatial";

/**
 * LENA World — the public entrance into the complete LENA system family.
 *
 * Six operational worlds share one Sacred Core. Product facts remain canonical
 * in `content/systems.ts`; this page orchestrates focus, spatial reading,
 * and calm exits into detailed product content.
 *
 * Spatial continuity:
 *   - returning from a chamber (browser or visible Back) restores the
 *     previously selected system — pinned to the history entry when the
 *     visitor chose it, to world memory otherwise;
 *   - a returning visitor who opens the world fresh finds their last system
 *     quietly emphasized (an `approach` beat) and can resume with one action;
 *   - a direct URL entry simply opens the field, with a stable default focus;
 *   - a visible "back to the house" control shares the browser Back's
 *     coherent behavior — outward, never a replay of the entrance.
 */
export default function WorldPage() {
  const { locale } = usePreferences();
  const seo = pageSeo("world", locale);
  const entities = useMemo(() => worldEntities(), []);
  const defaultId = useMemo(
    () => entities.find((entity) => entity.systemId === "property")?.systemId ?? entities[0]?.systemId ?? null,
    [entities],
  );

  const { navState, direction, arrivalIntent } = useSpatialContext();
  const memory = useWorldMemory();
  const { back, pinContext } = useSpatialNavigate();
  const enterPortal = useWorldPortalTransition();
  const sectionRef = useRef<HTMLElement | null>(null);
  const approachPlayed = useRef(false);

  const rememberedId = useMemo(() => {
    const id = navState?.spatial.systemId ?? null;
    if (id && worldRegistry.isKnownSystem(id)) return id;
    const remembered =
      memory && (memory.lastSpace === "world" || memory.lastSpace === "chamber")
        ? memory.lastSystemId
        : null;
    return remembered && worldRegistry.isKnownSystem(remembered) ? remembered : null;
  }, [navState, memory]);

  const restoredFromMemory =
    rememberedId !== null &&
    rememberedId === (memory?.lastSystemId ?? null) &&
    navState?.spatial.systemId !== rememberedId;

  const [selectedId, setSelectedId] = useState<string | null>(() => rememberedId ?? defaultId);

  const prevLocale = useRef(locale);
  useEffect(() => {
    if (prevLocale.current === locale) return;
    prevLocale.current = locale;
    setSelectedId(defaultId);
  }, [locale, defaultId]);

  useEffect(() => {
    if (!restoredFromMemory || !selectedId || approachPlayed.current) return;
    approachPlayed.current = true;
    const timer = window.setTimeout(() => {
      const root = sectionRef.current?.querySelector<HTMLElement>(".lena-world");
      if (!root) return;
      const subject = root.querySelector<HTMLElement>(".lena-world-entity.is-selected");
      spatialRuntime.run({
        intent: "approach",
        scene: "world",
        targets: {
          root: root as unknown as Parameters<typeof spatialRuntime.run>[0]["targets"]["root"],
          subject: subject as unknown as never,
        },
      });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [restoredFromMemory, selectedId]);

  const isOutwardArrival = direction === "back" || arrivalIntent === "emerge";

  const handleSelect = (systemId: string) => {
    setSelectedId(systemId);
    worldMemory.remember({ space: "world", systemId });
    pinContext({ systemId });
  };

  const isReturning = memory !== null;
  const rememberedName =
    isReturning && selectedId
      ? worldRegistry.nameFor(selectedId, locale)
      : null;

  return (
    <PublicShell>
      <SeoHead title={seo.title} description={seo.description} path="/world" />

      <section
        ref={sectionRef}
        className={`lena-world-page lena-container${isOutwardArrival ? " is-returning" : ""}`}
      >
        <p className="lena-kicker">
          {locale === "ar" ? "منظومة LENA" : "THE LENA CONSTELLATION"}
        </p>
        <h1 className="lena-world-title">
          {locale === "ar"
            ? "ستة عوالم تشغيلية، وقلب واحد يجمعها."
            : "Six operating worlds. One living center."}
        </h1>
        <p className="lena-world-intro">
          {locale === "ar"
            ? "العقارات والجمال والتأجير والضيافة والاستثمار وإعادة التدوير ليست بطاقات منفصلة هنا؛ كل نظام له شخصيته وحالته، وكلها تنتمي إلى عالم LENA واحد."
            : "Property, beauty, rental, hospitality, investment and recycling are not separate cards here. Each system has its own character and state, and all belong to one LENA world."}
        </p>

        <WorldScene entities={entities} selectedId={selectedId} onSelect={handleSelect} />

        <p className="lena-world-hint" aria-live="polite">
          {locale === "ar"
            ? isReturning && rememberedName
              ? `أهلًا بعودتك — ${rememberedName} بانتظار استئناف رحلتك.`
              : "اختر نظامًا: سيقترب، ويستجيب له قلب LENA، ثم يمكنك الدخول إلى تفاصيله."
            : isReturning && rememberedName
              ? `Welcome back — ${rememberedName} is ready where you left off.`
              : "Choose a system: it approaches, the LENA core responds, then you can step into its details."}
        </p>

        <p className="lena-world-entries">
          <Link className="lena-world-command-entry" to="/world/command">
            {locale === "ar" ? "ادخل غرفة قيادة العالم" : "Enter World Command"}
          </Link>
          <Link className="lena-world-atlas-entry" to="/world/atlas">
            {locale === "ar" ? "افتح أطلس العالم" : "Open the World Atlas"}
          </Link>
        </p>

        <nav
          className="lena-world-entities-list"
          aria-label={locale === "ar" ? "أنظمة LENA World" : "LENA World systems"}
        >
          {WORLD_ENTITIES.map((entity) => {
            const system = worldSystem(entity);
            if (!system) return null;
            return (
              <Link
                key={entity.systemId}
                to={entity.detailPath}
                className={`lena-world-list-link${memory?.lastSystemId === entity.systemId ? " is-remembered" : ""}`}
                onClick={(event) => enterPortal(entity.detailPath, entity.systemId, event)}
              >
                {system.name[locale]}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="lena-world-back"
          onClick={() => back()}
        >
          <span aria-hidden="true">{locale === "ar" ? "→" : "←"}</span>
          <span>{locale === "ar" ? "العودة إلى البيت" : "Back to the house"}</span>
        </button>

      </section>
    </PublicShell>
  );
}
