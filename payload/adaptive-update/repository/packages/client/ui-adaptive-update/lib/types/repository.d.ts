/** Exact-ref Git inspection and disposable review worktree lifecycle. */
import type { CompatibilityReport } from './types.ts';
/** Result of the deterministic trial merge performed before conflict adaptation. */
export interface RepositoryReview {
    reviewPath: string;
    currentCommit: string;
    upstreamCommit: string;
    upstreamRef: string;
    report: CompatibilityReport;
}
/**
 * Create the adaptation worktree and repeat the exact pinned trial merge.
 * @param options - repository, control root, and job identity.
 * @param currentCommit - local product commit containing the updater.
 * @param upstreamCommit - exact official commit already reviewed.
 * @returns candidate worktree path.
 */
export declare function createCandidateWorktree(options: {
    repositoryRoot: string;
    controlRoot: string;
    jobId: string;
}, currentCommit: string, upstreamCommit: string): Promise<string>;
/**
 * Require the stable Agent to leave a resolved, uncommitted candidate merge.
 * @param candidatePath - adaptation worktree.
 * @param currentCommit - original local product commit.
 */
export declare function assertCandidateResolved(candidatePath: string, currentCommit: string): Promise<void>;
/**
 * Pin upstream, compute two-sided changes, and leave a disposable trial merge
 * for exact conflict discovery.
 * @param options - exact repository, control root, job, and upstream source.
 * @returns pinned commits, review worktree, and deterministic report.
 */
export declare function createRepositoryReview(options: {
    repositoryRoot: string;
    controlRoot: string;
    jobId: string;
    upstreamUrl: string;
    upstreamBranch: string;
}): Promise<RepositoryReview>;
/**
 * Remove one registered review worktree without following paths inside it.
 * @param repositoryRoot - source checkout owning the worktree registry.
 * @param reviewPath - exact registered review path.
 */
export declare function removeReviewWorktree(repositoryRoot: string, reviewPath: string): Promise<void>;
/**
 * Remove a registered candidate worktree and its temporary branch.
 * @param repositoryRoot - source checkout owning the worktree registry.
 * @param candidatePath - exact registered candidate worktree path.
 * @param jobId - operation identity used by the temporary branch.
 */
export declare function removeCandidateWorktree(repositoryRoot: string, candidatePath: string, jobId: string): Promise<void>;
//# sourceMappingURL=repository.d.ts.map