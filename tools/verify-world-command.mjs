import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(ROOT, path), "utf8");

const command = read("artifacts/lena/src/features/world/command/WorldCommand.tsx");
const page = read("artifacts/lena/src/pages/WorldCommand.tsx");
const hook = read("artifacts/lena/src/features/core-intelligence/useLenaIntelligence.ts");
const runtime = read("artifacts/lena/src/features/world/signals/runtime.ts");
const app = read("artifacts/lena/src/App.tsx");
const world = read("artifacts/lena/src/pages/World.tsx");

let failures = 0;
const check = (name, fn) => {
  try {
    fn();
    console.log(`  PASS  ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`  FAIL  ${name}\n        ${error.message}`);
  }
};

console.log("\n== LENA World Command authority contract ==");

check("Command is a canonical route registered before the dynamic chamber", () => {
  const commandAt = app.indexOf('path="/world/command"');
  const paramAt = app.indexOf('path="/world/:systemId"');
  assert.ok(commandAt > -1, "/world/command is not registered");
  assert.ok(paramAt > commandAt, "/world/:systemId would swallow command");
});

check("the page is a thin route shell over the command chamber", () => {
  assert.match(page, /from "@\/features\/world\/command\/WorldCommand"/);
  assert.match(page, /path="\/world\/command"/);
});

check("Command reads fused observation from the intelligence kernel", () => {
  assert.match(command, /useLenaIntelligence/);
  assert.match(command, /context\.signals\.source/);
  assert.match(command, /source\.availability === "unavailable"/);
  assert.match(hook, /canonicalWorldGraphAdapter/);
});

check("Command keeps the signal runtime as the mutation adapter, not a second product registry", () => {
  assert.match(command, /useSignalRuntime/);
  assert.match(command, /acknowledge\(signal\.id\)/);
  assert.match(command, /resolve\(signal\.id\)/);
  assert.doesNotMatch(command, /worldMemory\.remember/);
  assert.doesNotMatch(command, /DEMO_SIGNALS/);
  assert.doesNotMatch(command, /publicProjects/);
  assert.match(runtime, /seed: WorldSignal\[\] = \[\]/);
  assert.doesNotMatch(runtime, /DEMO_SIGNALS/);
});

check("unavailable production cannot fabricate a pulse", () => {
  assert.match(command, /Live product signals are not connected yet/);
  assert.match(command, /data-signal-availability="unavailable"/);
  assert.match(command, /state-unavailable/);
  assert.doesNotMatch(
    command.slice(
      command.indexOf('source.availability === "unavailable"'),
      command.indexOf("const globalState"),
    ),
    /active worlds|attention pressure|runtime\.attention/,
  );
});

check("World still offers a calm entrance into Command", () => {
  assert.match(world, /to="\/world\/command"/);
});

console.log(failures === 0 ? "\nALL WORLD COMMAND CHECKS PASSED\n" : `\n${failures} WORLD COMMAND CHECKS FAILED\n`);
process.exit(failures ? 1 : 0);
