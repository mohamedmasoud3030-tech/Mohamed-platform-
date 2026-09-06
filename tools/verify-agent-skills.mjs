import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const skillsRoot = path.join(root, ".agents", "skills");

function fail(message) {
  console.error("Agent Skills verification failed: " + message);
  process.exitCode = 1;
}

function cleanYamlScalar(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

if (!fs.existsSync(skillsRoot)) {
  fail(".agents/skills does not exist");
} else {
  const dirs = fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (dirs.length === 0) fail("no skills found");

  for (const dir of dirs) {
    const skillPath = path.join(skillsRoot, dir, "SKILL.md");
    if (!fs.existsSync(skillPath)) {
      fail(dir + " is missing SKILL.md");
      continue;
    }

    const text = fs.readFileSync(skillPath, "utf8");
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) {
      fail(dir + "/SKILL.md must have YAML frontmatter followed by Markdown");
      continue;
    }

    const frontmatter = match[1];
    const body = match[2];
    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
    const descriptionMatch = frontmatter.match(/^description:\s*(.+)$/m);

    if (!nameMatch) {
      fail(dir + "/SKILL.md is missing name");
      continue;
    }
    if (!descriptionMatch) {
      fail(dir + "/SKILL.md is missing description");
      continue;
    }

    const name = cleanYamlScalar(nameMatch[1]);
    const description = cleanYamlScalar(descriptionMatch[1]);

    if (name !== dir) fail(dir + " name must match its parent directory");
    if (name.length < 1 || name.length > 64) fail(dir + " name must be 1-64 characters");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
      fail(dir + " name must use lowercase letters, numbers, and single hyphens only");
    }
    if (description.length < 1 || description.length > 1024) {
      fail(dir + " description must be 1-1024 characters");
    }

    const lineCount = text.split(/\r?\n/).length;
    if (lineCount > 500) fail(dir + "/SKILL.md exceeds 500 lines");

    const refs = new Set(
      [...body.matchAll(/references\/[A-Za-z0-9._/-]+\.md/g)].map((m) => m[0])
    );
    for (const ref of refs) {
      if (ref.includes("..")) {
        fail(dir + " reference escapes the skill root: " + ref);
        continue;
      }
      if (!fs.existsSync(path.join(skillsRoot, dir, ref))) {
        fail(dir + " references missing file " + ref);
      }
    }
  }
}

for (const alt of ["skills", path.join(".claude", "skills"), path.join(".github", "skills")]) {
  const altRoot = path.join(root, alt);
  if (!fs.existsSync(altRoot)) continue;

  const stack = [altRoot];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(next);
      if (entry.isFile() && entry.name === "SKILL.md") {
        fail("duplicate project skill authority found outside .agents/skills: " + path.relative(root, next));
      }
    }
  }
}

if (!process.exitCode) {
  console.log("Agent Skills verification passed.");
}
