import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

test("World Command is a canonical route before system chambers", () => {
  const app = readFileSync(join(root, "App.tsx"), "utf8");
  assert.match(app, /path="\/world\/command"/);
  const commandAt = app.indexOf("/world/command");
  const paramAt = app.indexOf("/world/:systemId");
  assert.ok(commandAt > -1 && paramAt > commandAt);
});

test("World Command navigates into existing world chambers", () => {
  const cmd = readFileSync(join(root, "features/world/command/WorldCommand.tsx"), "utf8");
  assert.match(cmd, /to=\{signal\.targetPath\}/);
  assert.match(cmd, /to=\{entity\.detailPath\}/);
  assert.match(cmd, /acknowledge\(signal\.id\)/);
  assert.match(cmd, /resolve\(signal\.id\)/);
});

test("World Command reads fused observation from intelligence and mutates only through the signal adapter", () => {
  const cmd = readFileSync(join(root, "features/world/command/WorldCommand.tsx"), "utf8");
  assert.match(cmd, /useLenaIntelligence/);
  assert.match(cmd, /context\.signals\.source/);
  assert.match(cmd, /useSignalRuntime/);
  assert.doesNotMatch(cmd, /DEMO_SIGNALS/);
  assert.doesNotMatch(cmd, /publicProjects/);
});

test("World constellation offers a calm entrance to command", () => {
  const world = readFileSync(join(root, "pages/World.tsx"), "utf8");
  assert.match(world, /to="\/world\/command"/);
});
