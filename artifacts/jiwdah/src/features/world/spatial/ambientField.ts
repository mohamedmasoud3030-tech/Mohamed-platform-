/**
 * Deterministic seeded ambient starfield (box-shadow dots).
 *
 * Shared by the homepage Orbit and the World scene: same generator, same
 * restrained count, no per-frame work — the field is painted once into a CSS
 * custom property and then only drifts.
 */
export function buildStars(count = 26, extent = 620, seedBase = 1337): string {
  let seed = seedBase;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const dots: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const x = Math.round(rnd() * extent);
    const y = Math.round(rnd() * extent);
    const size = rnd() > 0.72 ? 1.6 : 1;
    const o = (0.1 + rnd() * 0.28).toFixed(2);
    dots.push(`${x}px ${y}px 0 ${size}px rgba(178, 198, 255, ${o})`);
  }
  return dots.join(",");
}
