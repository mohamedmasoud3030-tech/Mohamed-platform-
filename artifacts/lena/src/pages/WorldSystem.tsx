import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import SeoHead from "@/components/SeoHead";
import type { OperatingPrimitiveId } from "@/content/systems";
import InnerConstellation from "@/features/world/components/InnerConstellation";
import { OperatingSurfaces } from "@/features/world/components/OperatingSurfaces";
import { OPERATING_PRIMITIVES } from "@/features/world/content/operating-primitives";
import { productContractFor } from "@/features/world/content/product-contract";
import { findWorldEntity, worldSystem } from "@/features/world/content/world";
import PublicShell from "@/layouts/PublicShell";
import { useSpatialContext, useSpatialNavigate, worldMemory } from "@/lib/spatial";
import { usePreferences } from "@/providers/preferences";

/**
 * System Chamber — the calm landing surface after a spatial World portal.
 *
 * This page owns no product facts. Every meaningful sentence comes from the
 * canonical BusinessSystem record; World contributes only its explicit visual
 * state and Digital DNA. The Inner Constellation also resolves exclusively
 * from `system.does`, turning verified operating scope into spatial structure
 * without inventing workflow order, telemetry or capabilities.
 *
 * Arrival is semantic, not a single animation:
 *   - `descend` (from the World portal)   → the chamber arrival choreography
 *   - a back move (browser or visible)    → an outward settle, no replay of
 *                                           the entrance
 *   - a direct URL entry                  → a calm neutral arrival
 * The URL remains canonical in all three cases; spatial state only shapes
 * how the chamber receives the visitor.
 */
type ChamberArrival = "arrival" | "return" | "neutral";

export default function WorldSystem() {
  const { systemId } = useParams();
  const { locale } = usePreferences();
  const entity = findWorldEntity(systemId);
  const system = entity ? worldSystem(entity) : undefined;
  const { navState, direction, isDirectEntry } = useSpatialContext();
  const { back } = useSpatialNavigate();

  // Inner space: the chamber's constellation can become the dominant object
  // while the chamber context stays visible — a `focus` without a route
  // change. Stepping back out is a `return`: depth reverses one level.
  const [innerFocus, setInnerFocus] = useState(false);

  const chamberPath = `/world/${systemId}`;

  // A chamber reached by its own URL (or reloaded) still belongs to the
  // journey: record it, and mark how the visitor got here.
  useEffect(() => {
    if (!entity) return;
    worldMemory.remember({
      space: "chamber",
      systemId: entity.systemId,
      chamberPath,
      ...(isDirectEntry ? { entryContext: "deep-link" as const } : {}),
    });
  }, [entity, systemId, chamberPath, isDirectEntry]);

  const releaseInnerFocus = useCallback(() => {
    setInnerFocus(false);
  }, []);

  if (!entity || !system) return <Navigate to="/world" replace />;

  const isArabic = locale === "ar";

  // Semantic arrival, resolved from the spatial context. Direction outranks
  // everything: a back move is an outward settle, even when the entry was
  // originally created by a portal descent.
  const arrival: ChamberArrival =
    direction === "back"
      ? "return"
      : navState?.spatial.intent === "descend" && navState.spatial.mode === "forward"
        ? "arrival"
        : navState?.spatial.intent === "emerge"
          ? "return"
          : "neutral";

  const description = system.tagline?.[locale] ?? system.problem[locale];
  const productContract = productContractFor(system.id);

  return (
    <PublicShell>
      <SeoHead
        title={`${system.name[locale]} — LENA World`}
        description={description}
        path={`/world/${system.id}`}
      />

      <main
        className={`lena-system-chamber dna-${entity.dna} state-${entity.state}${
          arrival === "arrival"
            ? " is-arrival"
            : arrival === "return"
              ? " is-return"
              : ""
        }${innerFocus ? " is-inner-focus" : ""}`}
      >
        <div className="lena-container">
          <button
            type="button"
            className="lena-chamber-back"
            onClick={() => back()}
            aria-label={isArabic ? "العودة إلى عالم LENA" : "Back to LENA World"}
          >
            <span aria-hidden="true">←</span>
            <span>{isArabic ? "العودة إلى عالم LENA" : "Back to LENA World"}</span>
          </button>

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

            <div className={`lena-inner-stage${innerFocus ? " is-focused" : ""}`}>
              <InnerConstellation
                systemName={system.name[locale]}
                operations={system.does[locale]}
                ariaLabel={
                  isArabic
                    ? `الخريطة التشغيلية لنظام ${system.name[locale]}`
                    : `${system.name[locale]} operating constellation`
                }
              />
              {innerFocus ? (
                <button
                  type="button"
                  className="lena-inner-exit"
                  onClick={releaseInnerFocus}
                >
                  <span aria-hidden="true">↑</span>
                  <span>{isArabic ? "العودة إلى الغرفة" : "Return to the chamber"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="lena-inner-entry"
                  onClick={() => {
                    setInnerFocus(true);
                    worldMemory.remember({ inner: "constellation" });
                  }}
                >
                  <span>{isArabic ? "ادخل الفضاء الداخلي" : "Enter the inner space"}</span>
                  <span aria-hidden="true">↓</span>
                </button>
              )}
            </div>
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
            evidence={productContract?.evidence}
          />

          {productContract?.handoff ? (
            <section
              className="lena-chamber-boundary"
              aria-label={isArabic ? "حدود اتصال المنتج" : "Product connection boundary"}
            >
              <small>{isArabic ? "اتصال المنتج" : "PRODUCT CONNECTION"}</small>
              <p>
                {isArabic
                  ? "يفتح MALEK الفعلي في جلسة مستقلة. المصادقة تبقى لدى MALEK، ولا تشارك LENA أي بيانات تشغيلية أو بيانات عملاء."
                  : "The real MALEK product opens in its own session. Authentication stays with MALEK; LENA shares no operational or customer data."}
              </p>
              <span>
                {isArabic
                  ? "المراقبة التشغيلية الحية غير متصلة بـ LENA حاليًا."
                  : "Live operational observation is not connected to LENA yet."}
              </span>
            </section>
          ) : null}

          <section className="lena-chamber-actions">
            {system.id === "wellness" && (
              <Link className="lena-primary" to="/lara-beauty">
                {isArabic ? "شوف شاشات Lara Beauty الحقيقية" : "See real Lara Beauty screens"}
              </Link>
            )}
            {productContract?.handoff ? (
              <a
                className="lena-primary"
                href={productContract.handoff.href}
                target="_blank"
                rel="noreferrer"
                aria-label={
                  isArabic
                    ? `افتح ${system.name[locale]} الفعلي — سجّل الدخول لدى المنتج`
                    : `Open the real ${system.name[locale]} product — sign in there`
                }
                data-testid="malek-product-handoff"
              >
                {isArabic
                  ? `افتح ${system.name[locale]} الفعلي — سجّل الدخول هناك`
                  : `Open the real ${system.name[locale]} product — sign in there`}
              </a>
            ) : (
              <Link className="lena-primary" to={`/services#${system.id}`}>
                {isArabic ? "افتح التفاصيل التشغيلية" : "Open operating detail"}
              </Link>
            )}
            <Link className="lena-secondary" to={`/contact?service=${system.id}`}>
              {isArabic ? "تحدث معنا عن هذا النظام" : "Talk to us about this system"}
            </Link>
          </section>
        </div>
      </main>
    </PublicShell>
  );
}
