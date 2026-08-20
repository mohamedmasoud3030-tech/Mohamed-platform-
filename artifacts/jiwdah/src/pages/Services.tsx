import LenaCta from "@/components/LenaCta";
import ServiceGrid from "@/components/ServiceGrid";
import PublicShell from "@/layouts/PublicShell";
import SeoHead from "@/components/SeoHead";
import { pageSeo } from "@/content/seo";
import { useSiteCopy } from "@/hooks/useSiteCopy";
import { usePreferences } from "@/providers/preferences";
export default function Services() { const copy = useSiteCopy(); const { locale } = usePreferences(); const seo = pageSeo("services", locale); return <PublicShell><SeoHead title={seo.title} description={seo.description} path="/services" /><section className="lena-page lena-container"><p className="lena-kicker">{copy.services.eyebrow}</p><h1 className="lena-page-title">{copy.services.title}</h1><p className="lena-lead">{copy.services.intro}</p></section><section className="lena-section"><div className="lena-container"><ServiceGrid /></div></section><LenaCta /></PublicShell>; }
