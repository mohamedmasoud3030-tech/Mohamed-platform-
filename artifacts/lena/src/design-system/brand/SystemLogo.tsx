import { useId } from "react";
import type { SystemId } from "@/content/systems";

/**
 * System logos — real vector marks from each product.
 *
 * - property (MALEK):      geometric M mark (navy / cyan)
 * - wellness (Lara Beauty): elegant rose-gold mark on deep jewel tone
 * - rental (LENA Dress):    hangar & dress mark (gold / cyan)
 * - investment (Terranex):  geometric growth mark (amber / orange)
 * - hospitality:            authentic dallah / coffee pot mark (warm cafe)
 * - recycling (Kayyal):     circular flow mark (emerald green)
 * - materials (Lenastore):  structural cube / materials mark (slate)
 */
export function SystemLogo({
  systemId,
  size = 40,
  className = "",
}: {
  systemId: SystemId;
  size?: number;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");

  switch (systemId) {
    case "property":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 256 192"
          fill="none"
          role="img"
          aria-label="MALEK"
          className={className}
        >
          <path fill="#071B3C" d="M28 160V54c0-8 9-13 16-9l84 53-24 31-44-28v59H28Z" />
          <path fill="#1688BC" d="M228 160V54c0-8-9-13-16-9l-84 53 24 31 44-28v59h32Z" />
          <path fill="#18B9E6" d="m128 98 84-53c7-4 16 1 16 9v18l-76 57-24-31Z" />
          <path fill="#102A54" d="M28 54c0-8 9-13 16-9l84 53-24 31-76-57V54Z" opacity=".72" />
          <path fill="#FFFFFF" d="m104 129 24-31 24 31v31h-48v-31Z" />
        </svg>
      );

    case "wellness": {
      const bgId = `${uid}_lb_bg`;
      const goldId = `${uid}_lb_gold`;
      const pathH = `${uid}_h`;
      const pathP = `${uid}_p`;
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 512 512"
          role="img"
          aria-label="Lara Beauty"
          className={className}
        >
          <defs>
            <radialGradient id={bgId} cx="34%" cy="22%" r="91%">
              <stop stopColor="#7D285D" />
              <stop offset=".56" stopColor="#57143E" />
              <stop offset="1" stopColor="#2A0A20" />
            </radialGradient>
            <linearGradient id={goldId} x1="138" y1="104" x2="369" y2="425" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFF2B8" />
              <stop offset=".43" stopColor="#F2CF77" />
              <stop offset="1" stopColor="#C68A36" />
            </linearGradient>
            <path id={pathH} d="M173 412C138 385 119 346 117 301c-4-72 25-133 78-171 44-32 101-40 150-19 44 19 74 58 81 105 8 55-12 105-55 141-30 25-44 50-42 72" />
            <path id={pathP} d="M318 148c13 28 12 58-3 84-7 12-6 21 5 27l25 13c8 4 8 12 0 17l-19 10c12 4 15 12 7 19l-14 11c2 18-8 34-24 44-20 12-46 8-63-8-9-9-15-19-17-31m17 31c-2 29-20 48-54 59m117-51c-5 28 13 45 50 57" />
          </defs>
          <rect width="512" height="512" rx="124" fill={`url(#${bgId})`} />
          <rect x="13" y="13" width="486" height="486" rx="112" fill="none" stroke="#F7D98B" strokeWidth="2" opacity=".13" />
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <g stroke="#17030F" opacity=".24">
              <use href={`#${pathH}`} strokeWidth="19" />
              <use href={`#${pathP}`} strokeWidth="19" />
            </g>
            <g stroke={`url(#${goldId})`}>
              <use href={`#${pathH}`} strokeWidth="10" />
              <use href={`#${pathP}`} strokeWidth="10" />
              <path d="M206 178c27-31 74-45 113-29" strokeWidth="7" opacity=".72" />
              <path d="M270 239c14-9 31-9 44 0" strokeWidth="7" />
              <path d="M274 257c10 7 23 7 33 0" strokeWidth="6" opacity=".88" />
              <path d="M176 412c43-17 82-11 118 17 30 23 58 25 88 8" strokeWidth="9" opacity=".8" />
            </g>
          </g>
          <g fill="#F8D986">
            <path d="M171 166l4 11 11 4-11 4-4 11-4-11-11-4 11-4z" />
            <circle cx="195" cy="153" r="4" opacity=".72" />
          </g>
        </svg>
      );
    }

    case "hospitality":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 512 512"
          fill="none"
          role="img"
          aria-label="Hospitality"
          className={className}
        >
          <rect width="512" height="512" rx="96" fill="#2A1810" />
          <rect x="160" y="180" width="160" height="200" rx="20" fill="#8B5E3C" />
          <rect x="180" y="160" width="120" height="28" rx="14" fill="#A0714F" />
          <circle cx="240" cy="155" r="10" fill="#C69C6D" />
          <path d="M320 220c30 0 50 20 50 50s-20 50-50 50" stroke="#8B5E3C" strokeWidth="16" strokeLinecap="round" />
          <path d="M160 240l-30-20v40l30-20Z" fill="#8B5E3C" />
          <path d="M220 130c0-20 10-30 10-50" stroke="#C69C6D" strokeWidth="6" strokeLinecap="round" opacity="0.6" />
          <path d="M250 120c0-20 10-30 10-50" stroke="#C69C6D" strokeWidth="6" strokeLinecap="round" opacity="0.4" />
          <path d="M280 130c0-20 10-30 10-50" stroke="#C69C6D" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
          <rect x="170" y="380" width="140" height="12" rx="6" fill="#6B4226" />
        </svg>
      );

    case "rental":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 512 512"
          fill="none"
          role="img"
          aria-label="LENA Dress"
          className={className}
        >
          <rect width="512" height="512" rx="96" fill="#0A2A3A" />
          <circle cx="180" cy="200" r="70" stroke="#42dcff" strokeWidth="16" />
          <circle cx="180" cy="200" r="30" fill="#42dcff" opacity="0.3" />
          <path d="M240 250l140 140" stroke="#42dcff" strokeWidth="16" strokeLinecap="round" />
          <path d="M330 340l40-40" stroke="#42dcff" strokeWidth="16" strokeLinecap="round" />
          <path d="M290 300l30-30" stroke="#42dcff" strokeWidth="16" strokeLinecap="round" />
        </svg>
      );

    case "investment":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 512 512"
          fill="none"
          role="img"
          aria-label="Terranex"
          className={className}
        >
          <rect width="512" height="512" rx="96" fill="#1A1208" />
          <path d="M100 380l80-120 70 60 120-180" stroke="#ff8c42" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M340 140h70v70" stroke="#ff8c42" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="100" y="400" width="310" height="6" rx="3" fill="#ff8c42" opacity="0.3" />
          <circle cx="100" cy="380" r="8" fill="#ff8c42" />
          <circle cx="180" cy="260" r="8" fill="#ff8c42" />
          <circle cx="250" cy="320" r="8" fill="#ff8c42" />
          <circle cx="370" cy="140" r="8" fill="#ff8c42" />
        </svg>
      );

    case "recycling":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 512 512"
          fill="none"
          role="img"
          aria-label="Kayyal"
          className={className}
        >
          <rect width="512" height="512" rx="96" fill="#0A1A0A" />
          <path d="M256 100a156 156 0 01135 78" stroke="#6bde4a" strokeWidth="14" strokeLinecap="round" />
          <path d="M391 178l-26 50-50-26" stroke="#6bde4a" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M391 334a156 156 0 01-135 78" stroke="#6bde4a" strokeWidth="14" strokeLinecap="round" />
          <path d="M256 412l-26-50h52" stroke="#6bde4a" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M121 334a156 156 0 010-156" stroke="#6bde4a" strokeWidth="14" strokeLinecap="round" />
          <path d="M121 178l26 50-50 26" stroke="#6bde4a" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="256" cy="256" r="40" fill="#6bde4a" opacity="0.15" />
        </svg>
      );

    case "materials":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 512 512"
          fill="none"
          role="img"
          aria-label="Lenastore"
          className={className}
        >
          <rect width="512" height="512" rx="96" fill="#141E28" />
          <path d="M256 120l120 70v140l-120 70-120-70V190l120-70Z" stroke="#7AA0C2" strokeWidth="14" strokeLinejoin="round" />
          <path d="M256 120v140l120 70M256 260l-120 70" stroke="#7AA0C2" strokeWidth="14" strokeLinejoin="round" />
        </svg>
      );

    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 512 512"
          fill="none"
          role="img"
          aria-label="System"
          className={className}
        >
          <rect width="512" height="512" rx="96" fill="#1A1A2E" />
          <circle cx="256" cy="256" r="100" stroke="#82a1ff" strokeWidth="12" />
          <circle cx="256" cy="256" r="40" fill="#82a1ff" opacity="0.3" />
        </svg>
      );
  }
}
