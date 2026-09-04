import { useSeo, type SeoInput } from "@/hooks/useSeo";
import { usePreferences } from "@/providers/preferences";

export type SeoHeadProps = Omit<SeoInput, "locale">;

/**
 * Declarative wrapper around useSeo. Renders nothing; every public route mounts
 * exactly one of these so <head> always describes the page being viewed.
 */
export default function SeoHead(props: SeoHeadProps) {
  const { locale } = usePreferences();
  useSeo({ ...props, locale });
  return null;
}
