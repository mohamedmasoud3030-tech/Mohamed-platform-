import type { SystemId } from "@/content/systems";

/**
 * System logos — real SVGs from each product's repo.
 *
 * Malek:       geometric M mark (navy/cyan)
 * Lara Beauty: golden flower on deep purple
 * Hospitality: coffee pot (cafe brown)
 * Others:      domain-specific SVG marks
 */
export function SystemLogo({
  systemId,
  size = 40,
}: {
  systemId: SystemId;
  size?: number;
}) {
  switch (systemId) {
    case "property":
      // Malek — real logo from repo (geometric M)
      return (
        <svg width={size} height={size} viewBox="0 0 512 512" fill="none" role="img" aria-label="Malek">
          <rect width="512" height="512" rx="96" fill="#0B1D3A" />
          <g transform="translate(128 160) scale(.98)">
            <path fill="#071B3C" d="M28 160 78 32l50 76-24 26-24-38-25 64H28Z" />
            <path fill="#1688BC" d="M228 160l-50-128-50 76 24 26 24-38 25 64h27Z" />
            <path fill="#18B9E6" d="m128 98 84-53c7-4 16 1 16 9v18l-76 57-24-31Z" />
          </g>
        </svg>
      );

    case "wellness":
      // Lara Beauty — real logo from repo (golden flower)
      return (
        <svg width={size} height={size} viewBox="0 0 512 512" role="img" aria-label="Lara Beauty">
          <defs>
            <radialGradient id="lb-bg" cx="34%" cy="22%" r="91%">
              <stop stopColor="#7D285D" />
              <stop offset=".56" stopColor="#57143E" />
              <stop offset="1" stopColor="#2A0A20" />
            </radialGradient>
            <linearGradient id="lb-gold" x1="138" y1="104" x2="369" y2="425" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFF2B8" />
              <stop offset=".43" stopColor="#F2CF77" />
              <stop offset="1" stopColor="#C68A36" />
            </linearGradient>
          </defs>
          <rect width="512" height="512" rx="96" fill="url(#lb-bg)" />
          <path
            d="M173 412C138 385 119 346 117 301c-4-72 25-133 78-171 44-32 101-40 150-19 44 19 74 58 81 105 8 55-12 105-55 141-30 25-44 50-42 72"
            fill="none"
            stroke="url(#lb-gold)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle cx="256" cy="256" r="40" fill="url(#lb-gold)" opacity="0.3" />
          <circle cx="256" cy="256" r="16" fill="url(#lb-gold)" opacity="0.6" />
        </svg>
      );

    case "hospitality":
      // Hospitality — coffee pot icon (cafe brown)
      return (
        <svg width={size} height={size} viewBox="0 0 512 512" fill="none" role="img" aria-label="Hospitality">
          <rect width="512" height="512" rx="96" fill="#2A1810" />
          {/* Coffee pot body */}
          <rect x="160" y="180" width="160" height="200" rx="20" fill="#8B5E3C" />
          {/* Pot lid */}
          <rect x="180" y="160" width="120" height="28" rx="14" fill="#A0714F" />
          <circle cx="240" cy="155" r="10" fill="#C69C6D" />
          {/* Handle */}
          <path d="M320 220c30 0 50 20 50 50s-20 50-50 50" stroke="#8B5E3C" strokeWidth="16" strokeLinecap="round" />
          {/* Spout */}
          <path d="M160 240l-30-20v40l30-20Z" fill="#8B5E3C" />
          {/* Steam */}
          <path d="M220 130c0-20 10-30 10-50" stroke="#C69C6D" strokeWidth="6" strokeLinecap="round" opacity="0.6" />
          <path d="M250 120c0-20 10-30 10-50" stroke="#C69C6D" strokeWidth="6" strokeLinecap="round" opacity="0.4" />
          <path d="M280 130c0-20 10-30 10-50" stroke="#C69C6D" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
          {/* Base */}
          <rect x="170" y="380" width="140" height="12" rx="6" fill="#6B4226" />
        </svg>
      );

    case "rental":
      // Rental — key icon (cyan)
      return (
        <svg width={size} height={size} viewBox="0 0 512 512" fill="none" role="img" aria-label="Rental">
          <rect width="512" height="512" rx="96" fill="#0A2A3A" />
          <circle cx="180" cy="200" r="70" stroke="#42dcff" strokeWidth="16" />
          <circle cx="180" cy="200" r="30" fill="#42dcff" opacity="0.3" />
          <path d="M240 250l140 140" stroke="#42dcff" strokeWidth="16" strokeLinecap="round" />
          <path d="M330 340l40-40" stroke="#42dcff" strokeWidth="16" strokeLinecap="round" />
          <path d="M290 300l30-30" stroke="#42dcff" strokeWidth="16" strokeLinecap="round" />
        </svg>
      );

    case "investment":
      // Investment — growth chart (orange)
      return (
        <svg width={size} height={size} viewBox="0 0 512 512" fill="none" role="img" aria-label="Investment">
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
      // Recycling — circular arrows (green)
      return (
        <svg width={size} height={size} viewBox="0 0 512 512" fill="none" role="img" aria-label="Recycling">
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

    default:
      return (
        <svg width={size} height={size} viewBox="0 0 512 512" fill="none">
          <rect width="512" height="512" rx="96" fill="#1A1A2E" />
          <circle cx="256" cy="256" r="100" stroke="#82a1ff" strokeWidth="12" />
          <circle cx="256" cy="256" r="40" fill="#82a1ff" opacity="0.3" />
        </svg>
      );
  }
}
