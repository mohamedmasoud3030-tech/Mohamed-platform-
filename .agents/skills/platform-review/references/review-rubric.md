# Platform Review Rubric

## Severity

P0 — Catastrophic or actively dangerous: destructive data loss, critical auth bypass, credential exposure, or production-breaking issue with no safe containment.

P1 — Must fix before merge: security boundary violation, cross-user/tenant exposure, broken critical path, unsafe migration, contract break, or major integrity regression.

P2 — Significant defect: correctness issue, material reliability/performance problem, missing important test, or maintainability problem likely to cause defects.

P3 — Minor: local clarity, low-impact edge case, non-blocking cleanup, or advisory improvement.

## Confidence

High — directly demonstrated by code, test, reproducible behavior, or authoritative contract.
Medium — strongly implied but one runtime fact is not directly observed.
Low — plausible concern needing confirmation. Low-confidence items should rarely block merge.

## Reviewer routing

Auth/secrets/uploads/outbound network:
- security and API perspectives.

Schema/migration/query/RLS:
- database and security perspectives.

New service/module/data boundaries:
- architecture plus relevant implementation surface.

Frontend behavior:
- runtime/accessibility plus contract/evidence authority where relevant.

Deployment/configuration:
- operations/security plus rollback.

## Security review principles

Use repository-specific facts. Identify frameworks before applying advice. Focus on concrete exploit or failure paths rather than generic checklists.

For explicit threat-model requests, cover:
- assets;
- trust boundaries;
- attacker capabilities;
- entry points;
- abuse paths;
- mitigations;
- assumptions.

Tenant isolation is a first-class trust boundary if multi-tenancy exists. Current Platform must not be described as multi-tenant unless the repository actually introduces that model.

## Upstream sources studied

EveryInc ce-code-review:
https://github.com/EveryInc/compound-engineering-plugin/blob/main/skills/guides/ce-code-review.md

OpenAI security-best-practices:
https://github.com/openai/skills/blob/main/skills/.curated/security-best-practices/SKILL.md

OpenAI security-threat-model:
https://github.com/openai/skills/blob/main/skills/.curated/security-threat-model/SKILL.md
