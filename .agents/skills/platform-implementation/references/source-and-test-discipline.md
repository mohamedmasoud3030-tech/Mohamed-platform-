# Source and Test Discipline

## Source hierarchy

Use this order for technical facts:
1. Current repository code and installed versions.
2. Official documentation for that exact library/framework.
3. Official source repository, migration guide, or release notes.
4. High-quality secondary material only when official material is insufficient.

Never substitute model memory for an available official source when the API is actively changing.

## Version-sensitive checklist

Before using a new API or pattern:
- Identify package and installed version.
- Search current repository usage.
- Check official docs or official source for that version/current supported behavior.
- Check migration notes if the project is near a major-version boundary.
- Record uncertainty if verification is impossible.

## Prove-it bug pattern

A regression fix is strongest when the failure exists before the fix and the same check passes after the fix.

Good candidates:
- pure logic regressions;
- route/contract bugs;
- permission boundary errors;
- data transformation bugs;
- reproducible UI state bugs.

Do not force a synthetic unit test when an existing integration or browser check is the real contract.

## Cleanup checklist

After implementation ask:
- Did this create a second authority?
- Is an old adapter now unreachable?
- Is a temporary test/helper still needed?
- Did a renamed contract leave stale imports or docs?
- Did a migration make an old compatibility branch dead?
- Did the change leave generated or test residue?

Remove confirmed residue in the same change.

## Upstream sources studied

Addy Osmani source-driven-development:
https://github.com/addyosmani/agent-skills/blob/main/skills/source-driven-development/SKILL.md

Addy Osmani test-driven-development:
https://github.com/addyosmani/agent-skills/blob/main/skills/test-driven-development/SKILL.md

Agent Skills best practices:
https://agentskills.io/skill-creation/best-practices
