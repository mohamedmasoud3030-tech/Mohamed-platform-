import { ArrowUpRight, MessageCircle } from "lucide-react";
import { Link } from "react-router";
import { SITE_CONFIG } from "@/config/site";
import { usePreferences } from "@/providers/preferences";

export default function LenaCta({ project = false, service, work }: { project?: boolean; service?: string; work?: string }) {
  const { locale } = usePreferences();
  const contactHref = service
    ? `/contact?service=${encodeURIComponent(service)}`
    : work
      ? `/contact?work=${encodeURIComponent(work)}`
      : "/contact";
  return <section className="lena-section"><div className="lena-container"><article className="lena-glass lena-cta"><div><p className="lena-kicker">LENA DIGITAL HOUSE</p><h2>{project ? (locale === "ar" ? "لديك مشروع يحتاج إلى نظام مشابه؟" : "Need a similar system for your project?") : (locale === "ar" ? "لديك فكرة تستحق ظهورًا أفضل؟" : "Have an idea that deserves a stronger presence?")}</h2><p>{locale === "ar" ? "ابدأ برسالة قصيرة. نرتب الفكرة ونحدد أوضح خطوة تالية." : "Start with a short message. We structure the idea and define the clearest next step."}</p></div><div className="lena-actions"><Link className="lena-primary" to={contactHref}>{locale === "ar" ? "ابدأ مشروعك" : "Start a project"}<ArrowUpRight size={16} /></Link><a className="lena-secondary" href={SITE_CONFIG.whatsappUrl} target="_blank" rel="noreferrer">WhatsApp<MessageCircle size={15} /></a></div></article></div></section>;
}
