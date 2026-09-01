import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import LenaCta from "@/components/LenaCta";
import SeoHead from "@/components/SeoHead";
import SystemGrid from "@/components/SystemGrid";
import DigitalHouseOrbit from "@/features/home/DigitalHouseOrbit";
import ProcessSection from "@/features/home/ProcessSection";
import { useGatewayToWorld } from "@/features/home/HomeGatewayTransition";
import PublicShell from "@/layouts/PublicShell";
import { pageSeo } from "@/content/seo";
import { organizationJsonLd } from "@/lib/seo";
import { usePreferences } from "@/providers/preferences";

export default function Home() {
  const { locale } = usePreferences();
  const gateway = useGatewayToWorld();
  const seo = pageSeo("home", locale);

  return (
    <PublicShell>
      <SeoHead title={seo.title} description={seo.description} path="/" jsonLd={organizationJsonLd(locale)} />
      <section className="lena-hero lena-container">
        <div>
          <p className="lena-kicker">LENA DIGITAL HOUSE — OPERATING WORLDS</p>
          <h1>
            {locale === "ar" ? (
              <>ندخل العمل إلى <span>عالم جديد</span></>
            ) : (
              <>Business becomes an <span>operating world</span></>
            )}
          </h1>
          <p className="lena-lead">
            {locale === "ar"
              ? "نبني عوالم تشغيل رقمية لأعمال حقيقية عبر العقارات والجمال والتأجير والاستثمار والضيافة وإعادة التدوير — لكل عالم عملياته وذكاؤه وبرنامجه الحقيقي، وتجمعها جذور تشغيلية واحدة داخل LENA."
              : "We build digital operating worlds across property, beauty, rental, investment, hospitality, and recycling — each with its own operations, intelligence, and real software, connected by a shared operating language inside LENA."}
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
              {locale === "ar" ? "ادخل عالم LENA" : "Enter LENA World"}
              <ArrowUpRight size={16} />
            </Link>
            <Link className="lena-secondary" to="/world">
              {locale === "ar" ? "استكشف الأنظمة" : "Explore systems"}
            </Link>
          </div>
          <a className="lena-scroll" href="#solutions">
            <ArrowDown size={15} />
            {locale === "ar" ? "اقترب… لكل نظام عالم في الداخل" : "Move closer… every system has a world inside"}
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
          <SystemGrid />
        </div>
      </section>
      <ProcessSection />
      <LenaCta />
    </PublicShell>
  );
}
