/**
 * Credential-safety boundary (review R-09), kept pure and free of the Serenity
 * stage bootstrap in `serenity.config.ts` so it is unit-tested in isolation.
 *
 * True when `url`'s host is the local Docker test target. Only there may the
 * well-known `admin`/`Password123!` defaults be used; any other (or unparseable)
 * host is a real store the caller must authenticate explicitly.
 */
export function isLocalhostTarget(url: string): boolean {
    try {
        const host = new URL(url).hostname.toLowerCase();
        return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
    } catch {
        return false;
    }
}
