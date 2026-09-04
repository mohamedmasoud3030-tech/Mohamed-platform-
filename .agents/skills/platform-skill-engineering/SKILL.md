---
name: platform-skill-engineering
description: "Design, modify, merge, delete, or evaluate Platform Agent Skills and agent workflows. Use when changing SKILL.md files, trigger descriptions, multi-step agent workflows, delegation, safety gates, progressive disclosure, skill references, or the project's Agent OS."
---

# Platform Skill Engineering

Use this skill before adding or changing any Agent Skill.

## First principle

Do not add a new skill just because a useful upstream skill exists. Start from a demonstrated project gap.

Classify the request:
- KEEP: current skill already covers it.
- MODIFY: improve one skill.
- MERGE: combine overlapping capabilities.
- DELETE: remove redundant or stale skill.
- MISSING: add only when no coherent existing skill can own the workflow.

## Design workflow

1. Define the trigger class.
   - Write a description that says what the skill does and when to use it.
   - Include concrete task vocabulary.
   - Avoid broad descriptions that trigger constantly.

2. Keep one coherent job per skill.
   - Broad enough to avoid chaining many tiny skills.
   - Narrow enough to activate predictably.

3. Use progressive disclosure.
   - Keep SKILL.md focused.
   - Move detailed checklists, templates, source notes, and examples into references/.
   - Load references only when their trigger condition is met.

4. Design workflow control.
   - Use explicit phases for fragile multi-step work.
   - Add safety gates before irreversible, security-sensitive, destructive, or externally visible actions.
   - Separate review from implementation.
   - Delegate only when the subtask has a clear input/output contract.

5. Evaluate before expanding.
   - Test positive trigger examples.
   - Test near-miss examples that should not trigger.
   - Compare output with and without the skill when possible.
   - Remove instructions the agent already handles reliably.

6. Maintain repository hygiene.
   - Canonical project skills live only in .agents/skills/.
   - Merge or remove superseded skills instead of leaving aliases indefinitely.
   - Remove obsolete references and tests in the same change.

## Specification constraints

Each skill directory must contain SKILL.md with:
- name matching the parent directory;
- lowercase letters, numbers, and hyphens only;
- non-empty description that explains capability and trigger;
- focused Markdown body.

Keep SKILL.md under 500 lines. Prefer references one level below the skill root.

Run pnpm run verify:skills before completion.

Read references/skill-design.md for evaluation, workflow patterns, and upstream sources.
