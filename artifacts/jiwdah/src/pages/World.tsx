import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import SeoHead from "@/components/SeoHead";
import { pageSeo } from "@/content/seo";
import PublicShell from "@/layouts/PublicShell";
import { usePreferences } from "@/providers/preferences";
import WorldScene from "@/features/world/components/WorldScene";
import { WORLD_ENTITIES, worldEntities, worldSystem } from "@/features/world/content/world";

/**
 * LENA World — the public entrance into the LENA ecosystem.
 *
 * One coherent spatial surface: the LENA center with the three v1 systems as
 * spatial entities. Selection is accessible (pointer, keyboard, touch), state
 * and DNA are encoded visually, and the selected entity exits into its calm,
 * detailed product content on /services.
 *
 * The page is lazy-loaded with the route; the scene itself is the content.
 */
export default function WorldPage() {
  const { locale } = usePreferences();
  const seo = pageSeo("world", locale);
  const entities = useMemo(() => worldEntities(), []);
  // The first entity is focused by default: on mobile this keeps one system
  // clearly in focus (nothing selected would leave the scene empty), and on
  // desktop it opens the World with a calm reveal already resolved.
  const [selectedId, setSelectedId] = useState<string | null>(entities[0]?.systemId ?? null);

  // Locale switches reset the scene to its default focus.
  useEffect(() => {
    setSelectedId(entities[0]?.systemId ?? null);
  }, [locale, entities]);

  return (
    <PublicShell>
      <SeoHead title={seo.title} description={seo.description} path="/world" />

      <section className="lena-world-page lena-container">
        <p className="lena-kicker">
          {locale === "ar" ? "منظومة LENA" : "THE LENA CONSTELLATION"}
        </p>
        <h1 className="lena-world-title">
          {locale === "ar" ? "أنظمة تشغيل مختلفة، تولد داخل عالم واحد." : "Operating systems, born into one world."}
        </h1>
        <p className="lena-world-intro">
          {locale === "ar"
            ? "ثلاثة أنشطة مختلفة، وثلاث حقائق تشغيلية مختلفة، ومنظومة LENA واحدة تنمو."
            : "Three different businesses. Three different operational realities. One growing LENA system."}
        </p>

        <WorldScene entities={entities} selectedId={selectedId} onSelect={setSelectedId} />

        <p className="lena-world-hint">
          {locale === "ar"
            ? "اختر نظامًا لتراه عن قرب، ثم ادخل إلى تفاصيله."
            : "Select a system to bring it closer, then step inside its details."}
        </p>

        <nav className="lena-world-entities-list" aria-label={locale === "ar" ? "أنظمة LENA World" : "LENA World systems"}>
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
      </section>
    </PublicShell>
  );
}
