import { Duration } from '@serenity-js/core';

export type BrowserEngine = 'chromium' | 'firefox' | 'webkit';

interface WaitPolicySeconds {
    responsiveUi: number;
    asynchronousUpdate: number;
    complexRender: number;
    routeTransition: number;
    cucumberStep: number;
}

// These values are ceilings, not fixed delays: Serenity's Wait returns as soon
// as the condition is met. The tiers replace the Chromium-tuned literals that
// were previously scattered through tasks and step definitions (backlog #15).
//
// Live-store baselines on 2026-07-20 showed Chromium crossing the former 15 s
// add-to-cart ceiling in CI, Firefox crossing both 15 s and 20 s ceilings, and
// WebKit repeatedly crossing the 20 s checkout-render ceiling. Keep the policy
// explicit so future evidence can tune one engine without editing test intent.
const WAIT_POLICY_SECONDS: Record<BrowserEngine, WaitPolicySeconds> = {
    chromium: {
        responsiveUi: 15,
        asynchronousUpdate: 25,
        complexRender: 30,
        routeTransition: 15,
        cucumberStep: 90,
    },
    firefox: {
        responsiveUi: 20,
        asynchronousUpdate: 30,
        complexRender: 45,
        routeTransition: 10,
        cucumberStep: 120,
    },
    webkit: {
        responsiveUi: 25,
        asynchronousUpdate: 45,
        complexRender: 60,
        routeTransition: 10,
        cucumberStep: 180,
    },
};

export function browserEngine(): BrowserEngine {
    const requested = (process.env.BROWSER ?? 'chromium').trim().toLowerCase();

    if (requested === 'chromium' || requested === 'firefox' || requested === 'webkit') {
        return requested;
    }

    throw new Error(
        `Unsupported BROWSER "${process.env.BROWSER}" — expected one of ` +
        `chromium | firefox | webkit (case-insensitive), or unset for the chromium default.`
    );
}

const selectedPolicy = WAIT_POLICY_SECONDS[browserEngine()];

export const waitFor = {
    responsiveUi: Duration.ofSeconds(selectedPolicy.responsiveUi),
    asynchronousUpdate: Duration.ofSeconds(selectedPolicy.asynchronousUpdate),
    complexRender: Duration.ofSeconds(selectedPolicy.complexRender),
} as const;

export const cucumberStepTimeoutMilliseconds = selectedPolicy.cucumberStep * 1000;
export const routeTransitionTimeoutMilliseconds = selectedPolicy.routeTransition * 1000;
