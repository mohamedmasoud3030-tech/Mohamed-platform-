import SeoHead from "@/components/SeoHead";
import PublicShell from "@/layouts/PublicShell";
import WorldCommand from "@/features/world/command/WorldCommand";
import { usePreferences } from "@/providers/preferences";

export default function WorldCommandPage() {
  const { locale } = usePreferences();
  return (
    <PublicShell>
      <SeoHead
        title={locale === "ar" ? "قيادة العالم — LENA" : "World Command — LENA"}
        description={
          locale === "ar"
            ? "غرفة تشغيل داخل عالم LENA: النبض، الإشارات، وحقل الانتباه."
            : "An operating chamber inside LENA World: pulse, signals, and the attention field."
        }
        path="/world/command"
      />
      <section className="lena-container lena-command-page">
        <WorldCommand />
      </section>
    </PublicShell>
  );
}
