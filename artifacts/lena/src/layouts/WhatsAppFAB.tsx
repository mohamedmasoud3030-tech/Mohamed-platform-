import { MessageCircle } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { track } from "@/lib/analytics";

export default function WhatsAppFAB() {
  return <a className="lena-whatsapp-fab" onClick={() => track("contact_channel_opened", { channel: "whatsapp", surface: "fab" })} href={SITE_CONFIG.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><MessageCircle size={20} /></a>;
}
