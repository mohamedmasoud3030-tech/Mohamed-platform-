import { Mail, MessageCircle } from "lucide-react";
import { Link } from "react-router";
import { SITE_CONFIG } from "@/config/site";
import { PUBLIC_NAVIGATION } from "@/content/navigation";
import LenaLogo from "@/design-system/brand/LenaLogo";
import { usePreferences } from "@/providers/preferences";

export default function PublicFooter() {
  const { locale } = usePreferences();
  return (
    <footer className="lena-footer">
      <div className="lena-footer-grid">
        <div><Link to="/" className="lena-brand-link"><LenaLogo /></Link><p>{locale === "ar" ? "بيت للحلول الرقمية الإبداعية: استراتيجية وتصميم ومحتوى ومواقع ومنتجات رقمية وأتمتة." : "A creative digital house for strategy, design, content, websites, digital products, and automation."}</p></div>
        <div><h2>{locale === "ar" ? "روابط سريعة" : "Quick links"}</h2><div className="lena-footer-links">{PUBLIC_NAVIGATION.map((item) => <Link key={item.to} to={item.to}>{locale === "ar" ? item.ar : item.en}</Link>)}<Link to="/help">{locale === "ar" ? "المساعدة" : "Help"}</Link></div></div>
        <div><h2>{locale === "ar" ? "ابدأ المحادثة" : "Start the conversation"}</h2><div className="lena-footer-links"><a href={SITE_CONFIG.whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={15} /><span dir="ltr">{SITE_CONFIG.phone.display}</span></a><a href={SITE_CONFIG.emailUrl}><Mail size={15} />{SITE_CONFIG.email}</a></div></div>
      </div>
      <small>© {new Date().getFullYear()} LENA Digital House</small>
    </footer>
  );
}
