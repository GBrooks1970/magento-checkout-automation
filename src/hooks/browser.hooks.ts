import { BeforeAll, Before, After, AfterAll, Status, setDefaultTimeout } from '@cucumber/cucumber';
import { Cast, engage } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import { CallAnApi } from '@serenity-js/rest';
import { chromium, firefox, webkit } from 'playwright';
import type { Browser, BrowserContext, BrowserType, Page } from 'playwright';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { BASE_URL } from '../serenity.config';
import { MagentoApi } from '../api/MagentoApiClient';
import { browserEngine, cucumberStepTimeoutMilliseconds } from '../config/wait-durations';

// Cross-browser run matrix (backlog #14 / planning proposal 0003). BROWSER
// selects the Playwright engine: unset defaults to chromium (the required CI
// gate); an unrecognised value fails loudly at BeforeAll rather than
// silently falling back. Firefox and WebKit are additive, non-blocking CI
// matrix legs (see .github/workflows/ci.yml) and can also be run locally,
// e.g. `BROWSER=firefox npm run test:smoke`.
function resolveBrowserType(): BrowserType {
    switch (browserEngine()) {
        case 'chromium':
            return chromium;
        case 'firefox':
            return firefox;
        case 'webkit':
            return webkit;
    }
}

// Trace + video on failure (backlog #13 / planning proposal 0002), gated
// off-by-default behind TRACE=on-failure. When unset, `Before`/`After` take
// the branches below marked "(TRACE off)" — byte-for-byte the pre-existing
// code path, so there is zero overhead when off.
//
// Design: when TRACE=on-failure, EVERY scenario gets its own freshly-created,
// isolated BrowserContext+Page (`BrowseTheWebWithPlaywright.usingPage`)
// instead of the shared `using(browser)` session — the only way to get a
// per-scenario Playwright video (`recordVideo` is a context-creation-time
// option) and a per-scenario trace. This deliberately does NOT touch
// `src/hooks/browser.hooks.ts`'s default shared-context path (see the "TRACE
// off" branches below): the cart-isolation fix (backlog #10) stays completely
// unreached and unmodified when the env var is unset. A fresh, isolated
// context also can't leak cookies between scenarios by construction (no
// shared state to reset), so isolation holds by a different, simpler
// mechanism than the default path's clear-cookies dance — verified by
// re-running the full suite with TRACE=on-failure and confirming the same
// cart counts as the default run.
//
// The trace (.zip, via Playwright's tracing API) and video (.webm, via
// `recordVideo`) are ALWAYS captured while TRACE=on-failure is set (result
// isn't known until the scenario ends), then kept only for scenarios that
// FAILED — passed-scenario artifacts are discarded in `After` so a green
// TRACE=on-failure run leaves docs/reports/{traces,videos}/ empty. Both
// directories are git-ignored (siblings of docs/reports/*.json, backlog #12).
const traceOnFailure = (process.env.TRACE ?? '').toLowerCase() === 'on-failure';
const tracesDir = path.join('docs', 'reports', 'traces');
const videosDir = path.join('docs', 'reports', 'videos');

function slugFor(pickleName: string, testCaseStartedId: string): string {
    const urlFriendly = pickleName.toLowerCase().replace(/[^\d.a-z-]/g, '-').replace(/-+/g, '-');
    return `${urlFriendly.slice(0, 64)}-${testCaseStartedId.slice(0, 8)}`;
}

// Only set while TRACE=on-failure; the isolated context+page for the
// scenario currently in progress, so `After` can finalise it.
let tracedContext: BrowserContext | undefined;
let tracedPage: Page | undefined;

// Cucumber's step timeout must sit above chained Serenity waits. The selected
// ceiling follows the same engine-aware policy as those waits (backlog #15),
// preserving headroom for WebKit's slower checkout re-renders without imposing
// a fixed delay on successful steps.
setDefaultTimeout(cucumberStepTimeoutMilliseconds);

// The browser is launched once for the whole run and kept open, and each
// scenario gets its own fresh browser context (see Before).
//
// Do NOT move the launch back into `Before` and close it in `After`: launching
// and closing per scenario leaves scenarios 2+ bound to a closed browser, so
// only the first scenario in a run passes and the rest fail at first navigation
// with "Target page, context or browser has been closed". See
// docs/implementation-logs/2026-06-02_live-smoke-test.md (§3.2) and backlog #8.
let browser: Browser;

BeforeAll(async () => {
    browser = await resolveBrowserType().launch({
        headless: (process.env.HEADLESS ?? 'true') === 'true',
    });

    // Resolve the admin bearer token once for the whole run, so API-driven
    // Background steps (ADR-0003) can authenticate against the catalogue API.
    // Prefers MAGENTO_ADMIN_TOKEN; otherwise mints one from admin credentials.
    await MagentoApi.authenticate();

    if (traceOnFailure) {
        fs.mkdirSync(tracesDir, { recursive: true });
        fs.mkdirSync(videosDir, { recursive: true });
    }
});

// Enforce per-scenario isolation. A Magento guest cart is keyed on the session
// cookie, so state surviving into the next scenario lets carts ACCUMULATE across
// scenarios — observed against the clean Docker store as cart counts of 3 where 2
// was expected and 8 where 1 was expected (backlog #10).
//
// Serenity/JS reuses a SINGLE Playwright browser context for the whole run with
// this `using(browser)` wiring (closing it out from under Serenity breaks every
// scenario after the first with "Target page, context or browser has been
// closed"). So rather than recreate the context, we RESET its state at the start
// of each scenario: clear cookies (drops the Magento PHPSESSID, so the next
// request starts a fresh, empty guest cart) and clear local/session storage (the
// Knockout.js mini-cart reads cached cart sections from `mage-cache-storage`).
//
// Cast.where is synchronous-only in Serenity/JS v3, so engagement stays in
// Before (per scenario) while the async launch lives in BeforeAll (once).
Before(async () => {
    if (traceOnFailure) {
        // Isolated path: fresh context+page per scenario, video+trace
        // capture always on, finalised (kept or discarded) in `After`. Does
        // NOT touch the shared-context reset logic below (TRACE off).
        tracedContext = await browser.newContext({ recordVideo: { dir: videosDir } });
        await tracedContext.tracing.start({ screenshots: true, snapshots: true });
        tracedPage = await tracedContext.newPage();

        engage(Cast.where(actor =>
            actor.whoCan(
                BrowseTheWebWithPlaywright.usingPage(tracedPage as Page),
                CallAnApi.at(BASE_URL),
            )
        ));
        return;
    }

    // TRACE off: the pre-existing shared-context reset path, unmodified.
    for (const context of browser.contexts()) {
        for (const page of context.pages()) {
            // 1. Clear the store-origin web storage while the page is still on it.
            //    Runs in the browser; reach storage via globalThis so this
            //    type-checks under the Node tsconfig (no DOM lib).
            await page.evaluate(() => {
                const w = globalThis as unknown as {
                    localStorage?: { clear(): void };
                    sessionStorage?: { clear(): void };
                };
                w.localStorage?.clear();
                w.sessionStorage?.clear();
            }).catch(() => { /* no accessible storage on this page */ });

            // 2. Park the page on about:blank to ABORT the previous scenario's
            //    in-flight requests before cookies are cleared. Magento re-sends
            //    `Set-Cookie: PHPSESSID=<same>` on every response, so a late
            //    async customer-data response landing AFTER clearCookies()
            //    re-installs the old session — the previous scenario's server-side
            //    cart then leaks into this one (observed in CI run 27295894167:
            //    count read 3 where 2 expected; the count survived a reload + 20 s
            //    poll, proving a server-side leak, not a stale client cache).
            await page.goto('about:blank').catch(() => { /* page already closing */ });
        }

        // 3. Clear cookies LAST, once nothing can re-set them. Deliberately NOT
        //    wrapped in a swallowing catch: if the reset genuinely fails, fail
        //    THIS scenario loudly at Before rather than as a baffling cart-count
        //    mismatch three steps later.
        await context.clearCookies();
    }

    engage(Cast.where(actor =>
        actor.whoCan(
            BrowseTheWebWithPlaywright.using(browser),
            CallAnApi.at(BASE_URL),
        )
    ));
});

// Finalises the isolated context created in `Before` when TRACE=on-failure:
// always stops tracing and closes the context (closing flushes the video to
// disk — Playwright only writes it on context close), then keeps the trace
// .zip + video .webm ONLY for a failed scenario; a passed scenario's capture
// is deleted so a green TRACE=on-failure run leaves both directories empty.
// No-op entirely when TRACE is unset (nothing to finalise).
After(async (testCase) => {
    if (!traceOnFailure || !tracedContext) {
        return;
    }

    const context = tracedContext;
    const page = tracedPage;
    tracedContext = undefined;
    tracedPage = undefined;

    const failed = testCase.result?.status !== Status.PASSED;
    const slug = slugFor(testCase.pickle.name, testCase.testCaseStartedId);

    if (failed) {
        await context.tracing.stop({ path: path.join(tracesDir, `${slug}.zip`) });
    } else {
        await context.tracing.stop();
    }

    const video = page?.video() ?? null;
    await context.close(); // flushes the video file to videosDir

    if (!video) {
        return;
    }

    const recordedPath = await video.path();
    if (failed) {
        fs.renameSync(recordedPath, path.join(videosDir, `${slug}.webm`));
    } else {
        fs.unlinkSync(recordedPath);
    }
});

AfterAll(async () => {
    if (browser) {
        await browser.close();
    }
});
