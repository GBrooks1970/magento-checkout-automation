/**
 * Trace/video retention decisions for the TRACE=on-failure capture path
 * (backlog #13), extracted from `browser.hooks.ts` so the pass/fail retention
 * rules are pure and unit-tested. Runtime behaviour is unchanged - the hook now
 * calls these instead of inlining the branches.
 *
 * The contract: a failed scenario keeps its captured trace (.zip) and video
 * (.webm); a passed scenario discards both, so a green TRACE=on-failure run
 * leaves docs/reports/{traces,videos}/ empty.
 */
export type ArtifactDisposition = 'retain' | 'discard' | 'none';

/** A scenario counts as failed for artefact retention unless it explicitly passed. */
export function scenarioFailed(status: string | undefined): boolean {
    return status !== 'PASSED';
}

/** The trace .zip is kept only for a failed scenario. */
export function traceDisposition(failed: boolean): 'retain' | 'discard' {
    return failed ? 'retain' : 'discard';
}

/**
 * The video .webm is kept for a failed scenario, discarded for a passed one, and
 * there is nothing to do when no video was recorded.
 */
export function videoDisposition(hasVideo: boolean, failed: boolean): ArtifactDisposition {
    if (!hasVideo) {
        return 'none';
    }
    return failed ? 'retain' : 'discard';
}
