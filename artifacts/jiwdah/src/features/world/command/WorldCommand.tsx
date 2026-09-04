import { Link } from "react-router";
import { usePreferences } from "@/providers/preferences";
import { findSystem } from "@/content/systems";
import { WORLD_ENTITIES, worldSystem } from "../content/world";
import {
  useSignalRuntime,
  type WorldSignal,
  type GlobalWorldState,
  type WorldPresence,
} from "../signals";

function stateLabel(state: GlobalWorldState, ar: boolean): string {
  if (ar) {
    if (state === "calm") return "هدوء";
    if (state === "active") return "حركة";
    if (state === "attention") return "انتباه";
    return "حرج";
  }
  return state;
}

function presenceLabel(p: WorldPresence, ar: boolean): string {
  if (ar) {
    if (p === "unavailable") return "غير متاح";
    if (p === "quiet") return "هادئ";
    if (p === "active") return "نشط";
    if (p === "attention") return "انتباه";
    return "حرج";
  }
  return p;
}

function relativeTime(iso: string, locale: string): string {
  const delta = Date.now() - Date.parse(iso);
  const mins = Math.max(1, Math.round(delta / 60000));
  if (mins < 60) return locale === "ar" ? `قبل ${mins} د` : `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 36) return locale === "ar" ? `قبل ${hours} س` : `${hours}h ago`;
  const days = Math.round(hours / 24);
  return locale === "ar" ? `قبل ${days} ي` : `${days}d ago`;
}

function SignalRow({
  signal,
  actions,
}: {
  signal: WorldSignal;
  actions?: boolean;
}) {
  const { locale } = usePreferences();
  const { acknowledge, resolve, canMutate } = useSignalRuntime();
  const system = findSystem(signal.sourceWorld);
  const ar = locale === "ar";
  if (!system) return null;

  return (
    <article className={`lena-cmd-signal sev-${signal.severity} life-${signal.lifecycle}`}>
      <header>
        <span className="lena-cmd-signal-world">{system.name[locale]}</span>
        <time dateTime={signal.timestamp}>{relativeTime(signal.timestamp, locale)}</time>
      </header>
      <h3>{signal.title[locale]}</h3>
      <p>{signal.description[locale]}</p>
      <footer>
        <span className="lena-cmd-chip">{signal.lifecycle}</span>
        <span className="lena-cmd-chip">{signal.severity}</span>
        {signal.targetPath ? (
          <Link className="lena-cmd-go" to={signal.targetPath}>
            {ar ? "ادخل العالم" : "Enter world"}
          </Link>
        ) : null}
        {actions && canMutate && signal.lifecycle !== "resolved" ? (
          <span className="lena-cmd-actions">
            {signal.lifecycle !== "acknowledged" ? (
              <button type="button" onClick={() => acknowledge(signal.id)}>
                {ar ? "إقرار" : "Acknowledge"}
              </button>
            ) : null}
            <button type="button" onClick={() => resolve(signal.id)}>
              {ar ? "حلّ" : "Resolve"}
            </button>
          </span>
        ) : null}
      </footer>
    </article>
  );
}

export default function WorldCommand() {
  const { locale } = usePreferences();
  const runtime = useSignalRuntime();
  const ar = locale === "ar";

  // Command remains a public route, but it must not turn an empty production
  // store into a quiet-looking operational dashboard. No counts, pressure,
  // state, signals, or mutation authority are rendered before a source exists.
  if (runtime.source.availability === "unavailable") {
    return (
      <div
        className="lena-command state-unavailable"
        data-testid="world-command"
        data-signal-availability="unavailable"
      >
        <header className="lena-command-pulse lena-command-unavailable-pulse">
          <p className="lena-kicker">{ar ? "غرفة القيادة · عالم LENA" : "WORLD COMMAND · LENA"}</p>
          <h1>{ar ? "نبض العالم" : "World Pulse"}</h1>
          <p className="lena-command-unavailable-message" role="status" aria-live="polite">
            <strong>
              {ar
                ? "الإشارات الحية للمنتجات غير متصلة بعد."
                : "Live product signals are not connected yet."}
            </strong>
            <span>
              {ar
                ? "لا يوجد مصدر منتج مصرح به للمراقبة. تبقى هذه الغرفة للعرض فقط حتى يتصل مصدر معتمد."
                : "No authorized product source is available for observation. This room stays read-only until one is connected."}
            </span>
          </p>
          <Link className="lena-command-back" to="/world">
            {ar ? "العودة إلى الكوكبة" : "Back to the constellation"}
          </Link>
        </header>
        <section
          className="lena-command-unavailable-panel"
          aria-label={ar ? "حالة مصدر الإشارات" : "Signal source status"}
        >
          <span className="lena-command-unavailable-mark" aria-hidden="true" />
          <p>
            {ar
              ? "لن نعرض أرقامًا أو حالات تشغيلية غير موثقة."
              : "No counts or operational states are shown without a verified source."}
          </p>
        </section>
      </div>
    );
  }

  const globalState = runtime.globalState;
  if (globalState === null) return null;

  return (
    <div
      className={`lena-command state-${globalState}`}
      data-testid="world-command"
      data-signal-availability={runtime.source.availability}
    >
      <header className="lena-command-pulse">
        <p className="lena-kicker">{ar ? "غرفة القيادة · عالم LENA" : "WORLD COMMAND · LENA"}</p>
        <h1>{ar ? "نبض العالم" : "World Pulse"}</h1>
        <p className="lena-command-pulse-state" aria-live="polite">
          <strong>{stateLabel(globalState, ar)}</strong>
          <span>
            {runtime.activeWorlds} {ar ? "عوالم نشطة" : "active worlds"}
          </span>
          <span>
            {ar ? "ضغط الانتباه" : "attention pressure"} {runtime.pressure}
          </span>
        </p>
        <Link className="lena-command-back" to="/world">
          {ar ? "العودة إلى الكوكبة" : "Back to the constellation"}
        </Link>
      </header>

      <div className="lena-command-grid">
        <section className="lena-command-zone lena-command-attention" aria-labelledby="cmd-attention">
          <h2 id="cmd-attention">{ar ? "حقل الانتباه" : "Attention Field"}</h2>
          {runtime.attention.length === 0 ? (
            <p className="lena-command-empty">{ar ? "لا شيء يتطلب تدخلًا." : "Nothing requires intervention."}</p>
          ) : (
            runtime.attention.map((s) => <SignalRow key={s.id} signal={s} actions />)
          )}
        </section>

        <section className="lena-command-zone lena-command-stream" aria-labelledby="cmd-stream">
          <h2 id="cmd-stream">{ar ? "تيار الإشارات" : "Signal Stream"}</h2>
          {runtime.recent.map((s) => (
            <SignalRow key={s.id} signal={s} />
          ))}
        </section>

        <section className="lena-command-zone lena-command-map" aria-labelledby="cmd-map">
          <h2 id="cmd-map">{ar ? "حضور العوالم" : "World Presence"}</h2>
          <ul className="lena-command-worlds">
            {WORLD_ENTITIES.map((entity) => {
              const system = worldSystem(entity);
              if (!system) return null;
              const presence = runtime.presence[entity.systemId] ?? "unavailable";
              return (
                <li key={entity.systemId}>
                  <Link
                    className={`lena-command-world dna-${entity.dna} presence-${presence}`}
                    to={entity.detailPath}
                    data-testid={`command-world-${entity.systemId}`}
                  >
                    <span className="lena-command-world-orb" aria-hidden="true" />
                    <strong>{system.name[locale]}</strong>
                    <em>{presenceLabel(presence, ar)}</em>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="lena-command-zone lena-command-resolved" aria-labelledby="cmd-resolved">
          <h2 id="cmd-resolved">{ar ? "ما عاد إلى الهدوء" : "Recent Resolutions"}</h2>
          {runtime.resolved.length === 0 ? (
            <p className="lena-command-empty">{ar ? "لا إغلاقات حديثة." : "No recent closures."}</p>
          ) : (
            runtime.resolved.map((s) => <SignalRow key={s.id} signal={s} />)
          )}
        </section>
      </div>
    </div>
  );
}
