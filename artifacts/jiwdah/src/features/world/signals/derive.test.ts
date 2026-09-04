import assert from "node:assert/strict";
import { test } from "node:test";
import {
  acknowledgeSignal,
  attentionSignals,
  globalStateFromSignals,
  presenceByWorld,
  presenceFromSignals,
  resolveSignal,
} from "./derive.ts";
import { DEMO_SIGNALS } from "./fixtures.ts";
import { createSignalStore } from "./runtime.ts";
import {
  UNAVAILABLE_SIGNAL_SOURCE,
  type SignalSourceState,
  type WorldSignal,
} from "./types.ts";

const WRITABLE_SOURCE: SignalSourceState = {
  availability: "available",
  observedAt: "2026-09-03T09:00:00.000Z",
  writable: true,
};

function sig(partial: Partial<WorldSignal>): WorldSignal {
  return {
    id: "t",
    sourceWorld: "property",
    kind: "activity",
    severity: "information",
    timestamp: "2026-09-03T00:00:00.000Z",
    title: { ar: "ت", en: "t" },
    description: { ar: "د", en: "d" },
    lifecycle: "active",
    ...partial,
  };
}

test("quiet when no open signals", () => {
  assert.equal(presenceFromSignals([sig({ lifecycle: "resolved" })]), "quiet");
  assert.equal(globalStateFromSignals([sig({ lifecycle: "resolved" })]), "calm");
});

test("active from open informational signals", () => {
  assert.equal(presenceFromSignals([sig({ severity: "information", lifecycle: "new" })]), "active");
  assert.equal(globalStateFromSignals([sig({ severity: "ambient", lifecycle: "active" })]), "active");
});

test("attention and critical dominate", () => {
  const mixed = [
    sig({ id: "a", severity: "information", lifecycle: "active" }),
    sig({ id: "b", severity: "attention", lifecycle: "new" }),
    sig({ id: "c", severity: "critical", lifecycle: "resolved" }),
  ];
  assert.equal(presenceFromSignals(mixed), "attention");
  mixed[2] = { ...mixed[2], lifecycle: "active" };
  assert.equal(presenceFromSignals(mixed), "critical");
  assert.equal(globalStateFromSignals(mixed), "critical");
});

test("presence is derived per world", () => {
  const map = presenceByWorld(DEMO_SIGNALS, [
    "property",
    "wellness",
    "recycling",
    "investment",
  ]);
  assert.equal(map.property, "attention");
  assert.equal(map.wellness, "active");
  assert.equal(map.recycling, "critical");
  assert.equal(map.investment, "quiet");
});

test("acknowledge and resolve mutate lifecycle", () => {
  const open = sig({ lifecycle: "new", severity: "attention" });
  const ack = acknowledgeSignal(open, "2026-09-03T12:00:00.000Z");
  assert.equal(ack.lifecycle, "acknowledged");
  assert.equal(presenceFromSignals([ack]), "attention");
  assert.equal(attentionSignals([ack]).length, 1);
  const done = resolveSignal(ack, "2026-09-03T13:00:00.000Z");
  assert.equal(done.lifecycle, "resolved");
  assert.equal(done.kind, "resolved");
  assert.equal(attentionSignals([done]).length, 0);
});

test("store acknowledge keeps presence until resolve", () => {
  const store = createSignalStore(
    [sig({ id: "one", lifecycle: "new", severity: "critical", sourceWorld: "recycling" })],
    WRITABLE_SOURCE,
  );
  store.acknowledge("one");
  assert.equal(store.getSnapshot()[0].lifecycle, "acknowledged");
  assert.equal(presenceFromSignals(store.getSnapshot()), "critical");
  store.resolve("one");
  assert.equal(store.getSnapshot()[0].lifecycle, "resolved");
  assert.equal(presenceFromSignals(store.getSnapshot()), "quiet");
});

test("production store starts empty and unavailable, while fixtures opt into a source", () => {
  const production = createSignalStore();
  assert.deepEqual(production.getSnapshot(), []);
  assert.deepEqual(production.getSource(), UNAVAILABLE_SIGNAL_SOURCE);
  production.emit(sig({ id: "blocked" }));
  production.acknowledge("blocked");
  assert.deepEqual(production.getSnapshot(), []);

  const fixture = createSignalStore([sig({ id: "fixture" })], WRITABLE_SOURCE);
  assert.equal(fixture.getSnapshot()[0].id, "fixture");
  assert.deepEqual(fixture.getSource(), WRITABLE_SOURCE);

  const readOnly = createSignalStore([sig({ id: "read-only" })], {
    ...WRITABLE_SOURCE,
    writable: false,
  });
  readOnly.acknowledge("read-only");
  readOnly.resolve("read-only");
  readOnly.emit(sig({ id: "blocked" }));
  assert.equal(readOnly.getSnapshot()[0].lifecycle, "active");
  assert.equal(readOnly.getSnapshot().length, 1);
});
