import { ArrowUpRight, Compass } from "lucide-react";
import { Link } from "react-router";
import SeoHead from "@/components/SeoHead";
import { pageSeo } from "@/content/seo";
import PublicShell from "@/layouts/PublicShell";
import { usePreferences } from "@/providers/preferences";

export default function NotFound() {
  const { locale } = usePreferences();
  const seo = pageSeo("notFound", locale);
  const isArabic = locale === "ar";

  return (
    <PublicShell>
      <SeoHead title={seo.title} description={seo.description} path="/404" noindex />
      <section className="lena-page lena-container">
        <p className="lena-kicker">404</p>
        <h1 className="lena-page-title">{seo.title}</h1>
        <p className="lena-lead">{seo.description}</p>
        <div className="lena-actions">
          <Link className="lena-primary" to="/">
            {isArabic ? "العودة إلى البداية" : "Back to home"}
            <ArrowUpRight size={16} />
          </Link>
          <Link className="lena-secondary" to="/portfolio">
            {isArabic ? "تصفّح الأعمال" : "Browse the work"}
          </Link>
          <Link className="lena-secondary" to="/contact">
            {isArabic ? "ابدأ مشروعك" : "Start a project"}
          </Link>
        </div>
      </section>
      <section className="lena-section">
        <div className="lena-container lena-bento">
          <article className="lena-glass lena-principle wide">
            <Compass size={18} />
            <h2>{isArabic ? "ربما تبحث عن أحد هذه المسارات" : "You may be looking for one of these"}</h2>
          </article>
          <article className="lena-glass lena-principle">
            <Link className="lena-more" to="/services">
              {isArabic ? "الحلول" : "Solutions"}
              <ArrowUpRight size={15} />
            </Link>
          </article>
          <article className="lena-glass lena-principle">
            <Link className="lena-more" to="/ai-solutions">
              {isArabic ? "الأنظمة الذكية" : "Smart systems"}
            </Link>
          </article>
          <article className="lena-glass lena-principle">
            <Link className="lena-more" to="/about">
              {isArabic ? "عالم LENA" : "Inside LENA"}
            </Link>
          </article>
        </div>
      </section>
    </PublicShell>
  );
}
