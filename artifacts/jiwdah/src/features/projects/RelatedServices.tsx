import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import { publicServices } from "@/content/services";
import type { StudioProject } from "@/content/projects";
import { usePreferences } from "@/providers/preferences";

export default function RelatedServices({ project }: { project: StudioProject }) {
  const { locale } = usePreferences();
  const services = publicServices().filter((service) => project.services.includes(service.id));
  return <section className="lena-section"><div className="lena-container">
    <p className="lena-kicker">{locale === "ar" ? "الخدمات المرتبطة" : "Related services"}</p>
    <h2 className="lena-section-title">{locale === "ar" ? "المسارات التي تكوّن هذا المشروع" : "The tracks shaping this project"}</h2>
    <div className="lena-bento lena-related-services">{services.map((service) => <article className={`lena-glass lena-service-card ${service.tone}`} key={service.id}><i className="lena-card-glow" /><h3>{service.title[locale]}</h3><p>{service.description[locale]}</p><Link className="lena-more" to={`/services/${service.id}`}>{locale === "ar" ? "استكشف الخدمة" : "Explore service"}<ArrowUpRight size={15} /></Link></article>)}</div>
  </div></section>;
}
