/**
 * Checkout-route recovery decisions for `StabiliseCheckoutRoute` (backlog #15),
 * extracted so the engine-specific recovery contract is pure and unit-tested.
 * Runtime behaviour is unchanged - the interaction now calls these instead of
 * inlining the `engine === ...` branches.
 */
import type { BrowserEngine } from './wait-durations';

/**
 * What to do when the Proceed-to-Checkout click does not reach `/checkout` in
 * time. Chromium is the required gate and must never conceal a broken button, so
 * it re-throws. Firefox and WebKit are exploratory, non-blocking legs that
 * sometimes sit on Magento's loader forever; they are recovered by navigating to
 * the canonical checkout route, with the recovery left observable for promotion
 * decisions (the `[MAG-15 route recovery]` telemetry).
 */
export function routeRecovery(engine: BrowserEngine): 'throw' | 'navigate' {
    return engine === 'chromium' ? 'throw' : 'navigate';
}

/**
 * WebKit can reach `/checkout` while Knockout's first bootstrap is permanently
 * stuck; only it needs a canonical reload after the route proof (the
 * `[MAG-15 bootstrap recovery]` telemetry). Chromium and Firefox do not.
 */
export function needsBootstrapReload(engine: BrowserEngine): boolean {
    return engine === 'webkit';
}
