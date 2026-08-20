/**
 * Which provider identities are recognised as the owner.
 *
 * Kept in its own dependency-free module for two reasons:
 *  - it is an access-control decision, so it must be independently testable
 *    without booting the database, the OAuth client or the logger;
 *  - it is small enough to read in full, which is what a rule like this needs.
 *
 * A single identity means one lost provider account locks the only operator out
 * of the dashboard permanently. A comma-separated allowlist makes that
 * recoverable, while the original single variable keeps working unchanged.
 *
 * This widens *recognition*, never *authentication*: the provider still proves
 * who the person is. No new sign-in path is introduced here.
 */

export function resolveOwnerIdentities(env: NodeJS.ProcessEnv = process.env): string[] {
  const raw = [env.OWNER_UNION_IDS ?? "", env.OWNER_UNION_ID ?? ""].join(",");
  const identities = new Set<string>();
  for (const entry of raw.split(",")) {
    const value = entry.trim();
    if (value) identities.add(value);
  }
  return [...identities];
}

export function isOwnerIdentity(userId: string, env: NodeJS.ProcessEnv = process.env): boolean {
  if (!userId?.trim()) return false;
  return resolveOwnerIdentities(env).includes(userId);
}
