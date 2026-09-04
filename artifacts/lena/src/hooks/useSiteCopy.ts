import { SITE_COPY } from "@/content/site-copy";
import { usePreferences } from "@/providers/preferences";

export function useSiteCopy() {
  const { locale } = usePreferences();
  return SITE_COPY[locale];
}
