/** Conflict-focused preparation shared by the detached worker and unit tests. */
import type { StableCommand } from './agent-runner.ts';
import type { RepositoryReview } from './repository.ts';
import type { CompatibilityReport, UpdatePhase } from './types.ts';
/** Completion marker required from every candidate adaptation task. */
export declare const ADAPTATION_COMPLETE = "[DSH_ADAPTATION_COMPLETE]";
/** Inputs fixed before the detached operation begins. */
export interface PreparationOptions {
    repositoryRoot: string;
    controlRoot: string;
    realHome: string;
    shadowHome: string;
    jobId: string;
    upstreamUrl: string;
    upstreamBranch: string;
    stableCommand: StableCommand;
}
/** Injectable operation edges; real implementations use Git and stable DSH. */
export interface PreparationDependencies {
    createReview: (options: PreparationOptions) => Promise<RepositoryReview>;
    removeReview: (repositoryRoot: string, reviewPath: string) => Promise<void>;
    createCandidate: (options: PreparationOptions, currentCommit: string, upstreamCommit: string) => Promise<string>;
    runAgent: (options: {
        cwd: string;
        shadowHome: string;
        stableCommand: StableCommand;
        task: string;
        timeoutMs: number | null;
    }) => Promise<string>;
    assertCandidateResolved: (candidatePath: string, currentCommit: string) => Promise<void>;
    publish: (phase: UpdatePhase, patch?: Record<string, unknown>) => Promise<void>;
}
/** Candidate and report produced before deterministic validation begins. */
export interface PreparedCandidate {
    candidatePath: string;
    currentCommit: string;
    upstreamCommit: string;
    report: CompatibilityReport;
}
/**
 * Inspect a disposable trial merge, then run a scope-matched Agent in a second worktree.
 * @param options - immutable job inputs.
 * @param dependencies - real or scripted operation edges.
 * @returns the resolved candidate and deterministic conflict inventory.
 */
export declare function prepareUpdateCandidate(options: PreparationOptions, dependencies: PreparationDependencies): Promise<PreparedCandidate>;
//# sourceMappingURL=worker.d.ts.map