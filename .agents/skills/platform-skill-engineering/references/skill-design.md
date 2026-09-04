# Skill Design Reference

## Trigger evaluation set

For every new or materially changed description, write a small mental or documented matrix:

Positive:
- direct task wording that must activate the skill;
- synonymous wording;
- a realistic project-specific example.

Negative:
- adjacent task that belongs to another skill;
- generic coding request that should not activate a specialist skill;
- historical/reference discussion with no execution intent.

If the trigger boundary is unclear, improve the description before adding more instructions.

## Workflow patterns

Use phases when order matters:
1. Discover evidence
2. Decide or plan
3. Execute
4. Verify
5. Independent review
6. Cleanup/handoff

Use gates before:
- destructive database operations;
- permission/auth changes;
- external side effects;
- irreversible migrations;
- production deployment;
- cross-provider or cross-agent data sharing.

Avoid:
- one skill per tiny tool action;
- descriptions like "helps with engineering";
- giant SKILL.md files containing every edge case;
- automatic fixing inside a review skill;
- hidden owner decisions;
- duplicate skill trees for different clients.

## Progressive disclosure target

Catalog:
- name + description only.

Activation:
- the full SKILL.md, kept focused and normally below 5,000 tokens and 500 lines.

Resources:
- references/, scripts/, and assets loaded only when needed.

## Upstream sources studied

Agent Skills specification:
https://agentskills.io/specification

Agent Skills best practices:
https://agentskills.io/skill-creation/best-practices

Agent Skills description optimization:
https://agentskills.io/skill-creation/optimizing-descriptions

Trail of Bits designing-workflow-skills:
https://github.com/trailofbits/skills/blob/5c15f4f5644b4bd3d48882a802a7232d501852b6/plugins/workflow-skill-design/skills/designing-workflow-skills/SKILL.md

Trail of Bits workflow anti-patterns:
https://github.com/trailofbits/skills/blob/main/plugins/workflow-skill-design/skills/designing-workflow-skills/references/anti-patterns.md

The project follows the open .agents/skills convention for cross-client interoperability.
