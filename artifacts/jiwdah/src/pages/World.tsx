import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import SeoHead from "@/components/SeoHead";
import { pageSeo } from "@/content/seo";
import PublicShell from "@/layouts/PublicShell";
import { usePreferences } from "@/providers/preferences";
import WorldScene from "@/features/world/components/WorldScene";
import ConstellationGraph from "@/features/world/components/ConstellationGraph";
import { WORLD_ENTITIES, worldEntities, worldSystem } from "@/features/world/content/world";
import { publicSystems } from "@/content/systems";

/**
 * LENA World — the public entrance into the complete LENA system family.
 *
 * Six operational worlds share one Sacred Core. Product facts remain canonical
 * in `content/systems.ts`; this page only orchestrates focus, spatial reading,
 * and calm exits into detailed product content.
 */
export default function WorldPage() {
  const { locale } = usePreferences();
  const seo = pageSeo("world", locale);
  const entities = useMemo(() => worldEntities(), []);
  const systems = useMemo(() => publicSystems(), []);
  const defaultId = useMemo(
    () => entities.find((entity) => entity.systemId === "property")?.systemId ?? entities[0]?.systemId ?? null,
    [entities],
  );
  const [selectedId, setSelectedId] = useState<string | null>(defaultId);

  // Keep a deliberate stable anchor when the language changes; mobile never
  // opens into an empty constellation and desktop starts from the live system.
  useEffect(() => {
    setSelectedId(defaultId);
  }, [locale, defaultId]);

  return (
    <PublicShell>
      <SeoHead title={seo.title} description={seo.description} path="/world" />

      <section className="lena-world-page lena-container">
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

        <WorldScene entities={entities} selectedId={selectedId} onSelect={setSelectedId} />

        <p className="lena-world-hint">
          {locale === "ar"
            ? "اختر نظامًا: سيقترب، ويستجيب له قلب LENA، ثم يمكنك الدخول إلى تفاصيله."
            : "Choose a system: it approaches, the LENA core responds, then you can step into its details."}
        </p>

        <nav
          className="lena-world-entities-list"
          aria-label={locale === "ar" ? "أنظمة LENA World" : "LENA World systems"}
        >
          {WORLD_ENTITIES.map((entity) => {
            const system = worldSystem(entity);
            if (!system) return null;
            return (
              <Link key={entity.systemId} to={entity.detailPath} className="lena-world-list-link">
                {system.name[locale]}
              </Link>
            );
          })}
        </nav>

        <ConstellationGraph systems={systems} locale={locale} />
      </section>
    </PublicShell>
  );
}
