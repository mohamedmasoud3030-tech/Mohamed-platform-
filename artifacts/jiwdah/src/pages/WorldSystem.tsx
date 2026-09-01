import { Link, Navigate, useLocation, useParams } from "react-router";
import SeoHead from "@/components/SeoHead";
import type { OperatingPrimitiveId } from "@/content/systems";
import InnerConstellation from "@/features/world/components/InnerConstellation";
import { OperatingSurfaces } from "@/features/world/components/OperatingSurfaces";
import { OPERATING_PRIMITIVES } from "@/features/world/content/operating-primitives";
import { findWorldEntity, worldSystem } from "@/features/world/content/world";
import PublicShell from "@/layouts/PublicShell";
import { usePreferences } from "@/providers/preferences";

type PortalArrivalState = {
  fromWorldPortal?: boolean;
  systemId?: string;
};

/**
 * System Chamber — the calm landing surface after a spatial World portal.
 *
 * This page owns no product facts. Every meaningful sentence comes from the
 * canonical BusinessSystem record; World contributes only its explicit visual
 * state and Digital DNA. The Inner Constellation also resolves exclusively from
 * `system.does`, turning verified operating scope into spatial structure without
 * inventing workflow order, telemetry or capabilities.
 */
export default function WorldSystem() {
  const { systemId } = useParams();
  const { locale } = usePreferences();
  const location = useLocation();
  const entity = findWorldEntity(systemId);
  const system = entity ? worldSystem(entity) : undefined;

  if (!entity || !system) return <Navigate to="/world" replace />;

  const isArabic = locale === "ar";
  const arrival = location.state as PortalArrivalState | null;
  const arrivedThroughPortal = Boolean(
    arrival?.fromWorldPortal && arrival.systemId === entity.systemId,
  );
  const description = system.tagline?.[locale] ?? system.problem[locale];

  return (
    <PublicShell>
      <SeoHead
        title={`${system.name[locale]} — LENA World`}
        description={description}
        path={`/world/${system.id}`}
      />

      <main
        className={`lena-system-chamber dna-${entity.dna} state-${entity.state}${arrivedThroughPortal ? " is-arrival" : ""}`}
      >
        <div className="lena-container">
          <Link className="lena-chamber-back" to="/world">
            <span aria-hidden="true">←</span>
            <span>{isArabic ? "العودة إلى عالم LENA" : "Back to LENA World"}</span>
          </Link>

          <section className="lena-chamber-hero">
            <div className="lena-chamber-copy">
              <p className="lena-kicker">
                {isArabic ? "غرفة النظام · عالم LENA" : "SYSTEM CHAMBER · LENA WORLD"}
              </p>
              <h1>{system.name[locale]}</h1>
              <p className="lena-chamber-industry">{system.industry[locale]}</p>
              {system.tagline ? (
                <p className="lena-chamber-tagline">{system.tagline[locale]}</p>
              ) : null}

              <div className="lena-chamber-signals" aria-label={isArabic ? "جذور التشغيل في هذا النظام" : "Operating roots inside this system"}>
                {system.operatingPrimitives.map((primitiveId: OperatingPrimitiveId) => {
                  const root = OPERATING_PRIMITIVES.find((entry) => entry.id === primitiveId);
                  if (!root) return null;
                  return (
                    <span key={primitiveId} className="lena-chamber-signal">
                      <i aria-hidden="true" />
                      {root.label[locale]}
                    </span>
                  );
                })}
              </div>
            </div>

            <InnerConstellation
              systemName={system.name[locale]}
              operations={system.does[locale]}
              ariaLabel={
                isArabic
                  ? `الخريطة التشغيلية لنظام ${system.name[locale]}`
                  : `${system.name[locale]} operating constellation`
              }
            />
          </section>

          <section className="lena-chamber-truth" aria-label={isArabic ? "حقيقة النظام" : "System truth"}>
            <article className="lena-chamber-panel lena-chamber-problem">
              <small>{isArabic ? "المشكلة الواقعية" : "THE REAL PROBLEM"}</small>
              <h2>{system.problem[locale]}</h2>
            </article>

            <article className="lena-chamber-panel lena-chamber-usage">
              <small>{isArabic ? "كيف يعيش في العمل اليومي" : "HOW IT LIVES IN DAILY WORK"}</small>
              <p>{system.usage[locale]}</p>
            </article>

            <article className="lena-chamber-panel">
              <small>{isArabic ? "ما الذي يديره" : "WHAT IT RUNS"}</small>
              <ul>
                {system.does[locale].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="lena-chamber-panel">
              <small>{isArabic ? "لمن بُني" : "WHO IT IS BUILT FOR"}</small>
              <ul>
                {system.beneficiaries[locale].map((person) => (
                  <li key={person}>{person}</li>
                ))}
              </ul>
            </article>
          </section>

          <section className="lena-chamber-roots" aria-label={isArabic ? "جذور التشغيل" : "Operating roots"}>
            <header>
              <small>{isArabic ? "جذور التشغيل داخل هذا النظام" : "OPERATING ROOTS INSIDE THIS SYSTEM"}</small>
              <h2>{isArabic ? "نفس القدرة التشغيلية عبر عوالم LENA" : "The same operating primitives across LENA worlds"}</h2>
            </header>
            <ul>
              {system.operatingPrimitives.map((primitiveId: OperatingPrimitiveId) => {
                const root = OPERATING_PRIMITIVES.find((entry) => entry.id === primitiveId);
                if (!root) return null;
                return (
                  <li key={primitiveId}>
                    <strong>{root.label[locale]}</strong>
                    <p>{root.meaning[locale]}</p>
                  </li>
                );
              })}
            </ul>
            <p className="lena-chamber-roots-note">
              {isArabic
                ? "هذه الجذور تتكرر في أنظمة أخرى داخل عالم LENA — وهي البداية المعمارية لما سيكون LENA OS."
                : "These roots repeat in other systems inside LENA World — the architectural beginning of what becomes LENA OS."}
            </p>
          </section>

          <OperatingSurfaces
            systemId={entity.systemId}
            brand={system.name[locale]}
          />

          <section className="lena-chamber-actions">
            <Link className="lena-primary" to={`/services#${system.id}`}>
              {isArabic ? "افتح التفاصيل التشغيلية" : "Open operating detail"}
            </Link>
            <Link className="lena-secondary" to={`/contact?service=${system.id}`}>
              {isArabic ? "تحدث معنا عن هذا النظام" : "Talk to us about this system"}
            </Link>
          </section>
        </div>
      </main>
    </PublicShell>
  );
}
