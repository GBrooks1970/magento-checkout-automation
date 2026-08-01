/**
 * Deterministic, filesystem-safe slug for a scenario's trace/video artefacts.
 *
 * Pure and side-effect-free (extracted from `browser.hooks.ts`, which has
 * import-time side effects) so the slug rules are unit-tested directly:
 * lower-cased, non `[0-9a-z.-]` runs collapsed to a single `-`, the readable
 * part capped at 64 chars, then suffixed with the first 8 chars of the
 * test-case-started id to keep same-named scenarios distinct.
 */
export function artifactSlug(pickleName: string, testCaseStartedId: string): string {
    const urlFriendly = pickleName.toLowerCase().replace(/[^\d.a-z-]/g, '-').replace(/-+/g, '-');
    return `${urlFriendly.slice(0, 64)}-${testCaseStartedId.slice(0, 8)}`;
}
