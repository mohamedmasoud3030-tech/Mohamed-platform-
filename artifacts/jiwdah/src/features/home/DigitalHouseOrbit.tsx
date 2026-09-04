import {
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { BUSINESS_SYSTEMS, type SystemId } from "@/content/systems";
import { usePreferences } from "@/providers/preferences";

/**
 * LENA orbital system.
 *
 * A spatial scene built from independent motion layers:
 *
 *   - ambient field  — faint stars + atmospheric haze, static, masked
 *   - orbital planes — four rings, each with its own period & direction
 *   - satellites     — LENA products riding three orbital planes; each
 *                      satellite is positioned by a single rAF pass that also
 *                      derives depth (scale / opacity / z) from its angle, so
 *                      products pass in front of and behind the core
 *   - LENA core      — stable center; only a restrained scale/glow breath
 *
 * Product names come from BUSINESS_SYSTEMS, so the hero never becomes a second
 * source of truth for naming or localisation.
 *
 * Motion is driven by transforms + opacity only. The rAF loop no-ops when the
 * scene is outside the viewport (IntersectionObserver) or under
 * `prefers-reduced-motion`; in reduced-motion the composition is placed once
 * and stays static. No dependencies, no per-frame React state.
 */

type Satellite = {
  id: SystemId;
  ring: 1 | 2 | 3;
  /** Initial angle in degrees; paired products remain opposite each other. */
  phase: number;
};

/** Ring geometry. Speeds are deg/sec derived from each ring's CSS period:
 *  lena-orbit-ring-1 40s fwd · lena-orbit-ring-2 55s back ·
 *  lena-orbit-ring-3 75s fwd (see orbit.css). */
const RING = {
  1: { radius: 126, speed: 360 / 40 },
  2: { radius: 176, speed: -(360 / 55) },
  3: { radius: 225, speed: 360 / 75 },
} as const;

/** Two real LENA products per plane. The fourth ring remains atmospheric only. */
const ORBIT_LAYOUT: Satellite[] = [
  { id: "wellness", ring: 1, phase: 30 },
  { id: "property", ring: 1, phase: 210 },
  { id: "rental", ring: 2, phase: 95 },
  { id: "recycling", ring: 2, phase: 275 },
  { id: "investment", ring: 3, phase: 40 },
  { id: "hospitality", ring: 3, phase: 220 },
];

const DEG = Math.PI / 180;

type OrbitState = {
  visible: boolean;
  entered: boolean;
  reduced: boolean;
  focus: boolean;
  t: number;
  last: number;
  px: number;
  py: number;
  z: number[];
  squash: number;
};

function buildStars(): string {
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const dots: string[] = [];
  for (let i = 0; i < 26; i += 1) {
    const x = Math.round(rnd() * 620);
    const y = Math.round(rnd() * 620);
    const size = rnd() > 0.72 ? 1.6 : 1;
    const o = (0.1 + rnd() * 0.28).toFixed(2);
    dots.push(`${x}px ${y}px 0 ${size}px rgba(178, 198, 255, ${o})`);
  }
  return dots.join(",");
}

export default function DigitalHouseOrbit() {
  const { locale } = usePreferences();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const satRefs = useRef<(HTMLDivElement | null)[]>([]);
  const state = useRef<OrbitState>({
    visible: false,
    entered: false,
    reduced: false,
    focus: false,
    t: 0,
    last: 0,
    px: 0,
    py: 0,
    z: new Array(ORBIT_LAYOUT.length).fill(0) as number[],
    squash: 1,
  });

  const satellites = ORBIT_LAYOUT.map((satellite) => ({
    ...satellite,
    label:
      BUSINESS_SYSTEMS.find((system) => system.id === satellite.id)?.name[locale] ??
      satellite.id,
  }));

  /** Read the plane tilt (--lena-squash) used by the CSS rings. */
  const readSquash = () => {
    const root = rootRef.current;
    if (!root) return;
    const v = parseFloat(getComputedStyle(root).getPropertyValue("--lena-squash"));
    state.current.squash = Number.isFinite(v) && v > 0 ? v : 1;
  };

  /** One positioning pass — places every satellite at angle θ with depth. */
  const renderSats = (t: number) => {
    const s = state.current;
    for (let i = 0; i < ORBIT_LAYOUT.length; i += 1) {
      const el = satRefs.current[i];
      if (!el) continue;
      const sat = ORBIT_LAYOUT[i];
      const ring = RING[sat.ring];
      const angle = ((sat.phase + t * ring.speed) % 360 + 360) % 360;
      const rad = angle * DEG;
      const depth = Math.sin(rad); // +1 = bottom (front), -1 = top (behind)
      const d01 = (depth + 1) / 2;
      const x = Math.cos(rad) * ring.radius;
      const y = Math.sin(rad) * ring.radius * s.squash;
      const scale = 0.95 + 0.09 * d01;
      const opacity = 0.68 + 0.32 * d01;
      const z = depth > 0 ? 4 : 2;
      el.style.transform = `translate3d(calc(-50% + ${(x + s.px * 0.4 + depth * 2).toFixed(2)}px), calc(-50% + ${(y + s.py * 0.4).toFixed(2)}px), 0) scale(${scale.toFixed(3)})`;
      el.style.opacity = opacity.toFixed(3);
      if (z !== s.z[i]) {
        s.z[i] = z;
        el.style.zIndex = String(z);
      }
    }
  };

  // Initial static placement before first paint (prevents any flash).
  useLayoutEffect(() => {
    readSquash();
    renderSats(0);
  }, []);

  // Keep the plane tilt in sync across viewport/orientation changes.
  useEffect(() => {
    readSquash();
    const onResize = () => readSquash();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Ambient star field (static box-shadow dots).
  useLayoutEffect(() => {
    const field = rootRef.current?.querySelector(".lena-orbit-field");
    if (field) (field as HTMLElement).style.setProperty("--lena-stars", buildStars());
  }, []);

  // Viewport awareness: assemble on first entry, pause when far outside.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const s = state.current;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          if (!s.entered) {
            s.entered = true;
            root.classList.add("is-visible");
          }
          s.visible = true;
          root.classList.remove("is-away");
        } else {
          s.visible = false;
          root.classList.add("is-away");
        }
      },
      { threshold: 0.08, rootMargin: "48px" },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  // Reduced motion: place once, never animate.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      state.current.reduced = mq.matches;
      if (mq.matches) renderSats(0);
    };
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // Continuous orbital pass — composited writes only, skipped offscreen.
  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      const s = state.current;
      if (s.visible && !s.reduced) {
        if (!s.last) s.last = now;
        const dt = Math.min((now - s.last) / 1000, 0.05);
        s.last = now;
        s.t += dt * (s.focus ? 0.16 : 1);
        renderSats(s.t);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Pointer parallax — desktop only, small, layered.
  function move(event: PointerEvent<HTMLDivElement>) {
    const root = rootRef.current;
    if (!root) return;
    if (
      window.matchMedia("(max-width: 900px)").matches ||
      state.current.reduced ||
      !window.matchMedia("(pointer: fine)").matches
    ) {
      return;
    }
    const rect = root.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;
    state.current.px = nx * 12;
    state.current.py = ny * 8;
    root.style.setProperty("--orbit-x", `${(nx * 10).toFixed(2)}px`);
    root.style.setProperty("--orbit-y", `${(ny * 7).toFixed(2)}px`);
  }

  function reset() {
    const root = rootRef.current;
    if (!root) return;
    state.current.px = 0;
    state.current.py = 0;
    root.style.setProperty("--orbit-x", "0px");
    root.style.setProperty("--orbit-y", "0px");
  }

  // Focus interaction — slow the system, emphasize the satellite + its ring.
  function onSatEnter(i: number) {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const root = rootRef.current;
    if (!root) return;
    state.current.focus = true;
    root.classList.add("is-focus");
    root
      .querySelector(`.lena-orbit-ring-${ORBIT_LAYOUT[i].ring}`)
      ?.classList.add("is-lit");
    satRefs.current[i]?.classList.add("is-active");
  }

  function onSatLeave(i: number) {
    const root = rootRef.current;
    if (!root) return;
    state.current.focus = false;
    root.classList.remove("is-focus");
    root.querySelector(".lena-ring-wrap.is-lit")?.classList.remove("is-lit");
    satRefs.current[i]?.classList.remove("is-active");
  }

  return (
    <div
      ref={rootRef}
      className="lena-orbit"
      onPointerMove={move}
      onPointerLeave={reset}
      aria-hidden="true"
    >
      <div className="lena-orbit-field" />
      <i className="lena-ring-wrap lena-orbit-ring-1">
        <i className="lena-ring" />
      </i>
      <i className="lena-ring-wrap lena-orbit-ring-2">
        <i className="lena-ring" />
      </i>
      <i className="lena-ring-wrap lena-orbit-ring-3">
        <i className="lena-ring" />
      </i>
      <i className="lena-ring-wrap lena-orbit-ring-4">
        <i className="lena-ring" />
      </i>
      {satellites.map((sat, i) => (
        <div
          key={sat.id}
          ref={(el) => {
            satRefs.current[i] = el;
          }}
          className="lena-sat"
          onPointerEnter={() => onSatEnter(i)}
          onPointerLeave={() => onSatLeave(i)}
        >
          <div
            className="lena-sat-inner"
            style={{ "--i": `${0.3 + i * 0.08}s` } as CSSProperties}
          >
            <span className="lena-sat-dot" />
            <span>{sat.label}</span>
          </div>
        </div>
      ))}
      <div className="lena-house">
        <small>LENA</small>
        <strong>
          DIGITAL
          <br />
          HOUSE
        </strong>
        <span>{locale === "ar" ? "أنظمة تشغيل" : "Operating systems"}</span>
      </div>
      <i className="lena-pulse" />
    </div>
  );
}
