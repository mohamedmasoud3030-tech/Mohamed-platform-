import { useMemo } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import LenaCta from "@/components/LenaCta";
import SeoHead from "@/components/SeoHead";
import SystemGrid from "@/components/SystemGrid";
import DigitalHouseOrbit from "@/features/home/DigitalHouseOrbit";
import ProcessSection from "@/features/home/ProcessSection";
import { useGatewayToWorld } from "@/features/home/HomeGatewayTransition";
import WorldContinuation from "@/features/world/spatial/WorldContinuation";
import { worldRegistry } from "@/features/world/registry";
import PublicShell from "@/layouts/PublicShell";
import { pageSeo } from "@/content/seo";
import { organizationJsonLd } from "@/lib/seo";
import {
  resolveContinuation,
  resolveRememberedFocus,
  useWorldMemory,
} from "@/lib/spatial";
import { usePreferences } from "@/providers/preferences";

export default function Home() {
  const { locale } = usePreferences();
  const gateway = useGatewayToWorld();
  const seo = pageSeo("home", locale);

  // World Memory: the gateway reads the visitor's last journey so a returning
  // visitor finds a continuation seam — never a forced redirect.
  const memory = useWorldMemory();
  const continuation = useMemo(
    () => resolveContinuation(memory, worldRegistry),
    [memory],
  );
  const rememberedSystemId = useMemo(
    () => resolveRememberedFocus(memory, worldRegistry),
    [memory],
  );
  const isReturning = memory !== null;

  return (
    <PublicShell>
      <SeoHead title={seo.title} description={seo.description} path="/" jsonLd={organizationJsonLd(locale)} />
      <section className="lena-hero lena-container">
        <div className="lena-hero-copy">
          <p className="lena-kicker">LENA DIGITAL HOUSE</p>
          {isReturning ? (
            <p className="lena-return-line">
              {locale === "ar" ? "مرحبًا بعودتك إلى العالم." : "Welcome back to the world."}
            </p>
          ) : null}
          <h1>
            {locale === "ar" ? (
              <>ادخل <span>عالم LENA الحي</span></>
            ) : (
              <>Enter a <span>living operating world</span></>
            )}
          </h1>
          <p className="lena-lead">
            {locale === "ar"
              ? isReturning
                ? "العالم يتذكر مكانك. تابع رحلتك، أو ابدأ من جديد — القرار لك."
                : "عوالم تشغيل حقيقية، بلغة مكانية واحدة. اقترب من النواة، اختر عالمًا، ثم تحرك إلى الداخل."
              : isReturning
                ? "The world remembers where you were. Continue your journey, or start again — the choice is yours."
                : "Real operating worlds, one spatial language. Approach the core, choose a world, then move inward."}
          </p>
          <div className="lena-actions">
            <Link
              className="lena-primary"
              to="/world"
              onClick={(event) => {
                event.preventDefault();
                gateway();
              }}
            >
              {locale === "ar" ? "ادخل العالم" : "Enter the world"}
              <ArrowUpRight size={16} />
            </Link>
            <Link className="lena-secondary" to="/world">
              {locale === "ar" ? "شاهد الأنظمة" : "See the systems"}
            </Link>
            {continuation ? (
              <WorldContinuation continuation={continuation} />
            ) : null}
          </div>
          <a className="lena-scroll" href="#solutions">
            <ArrowDown size={15} />
            {locale === "ar" ? "اختر عالمًا… ثم تحرك إلى الداخل" : "Choose a world… then move inward"}
          </a>
        </div>
        <DigitalHouseOrbit />
      </section>
      <section className="lena-section" id="solutions">
        <div className="lena-container">
          <p className="lena-kicker">{locale === "ar" ? "عوالم التشغيل" : "Operating worlds"}</p>
          <h2 className="lena-section-title">
            {locale === "ar"
              ? "أنظمة مختلفة. جذور تشغيلية تتكرر. عالم واحد يربطها."
              : "Different systems. Repeated operating roots. One world connecting them."}
          </h2>
          <p className="lena-section-lead">
            {locale === "ar"
              ? "اقترب من أي نظام لترى عملياته وذكاءه وواجهته الحقيقية داخل عالم LENA."
              : "Approach any system to reveal its operations, intelligence, and real product interface inside LENA World."}
          </p>
          <SystemGrid visitedSystemId={rememberedSystemId} />
        </div>
      </section>
      <ProcessSection />
      <LenaCta />
    </PublicShell>
  );
}
