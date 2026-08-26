/** Minimal candidate checks required before source or data cutover. */
import type { UpdateCheckResult } from './types.ts';
/** Injectable candidate-validation operations. */
export interface ValidationDependencies {
    unresolvedFiles: (candidatePath: string) => Promise<readonly string[]>;
    runCheck: (check: UpdateCheckResult, candidatePath: string) => Promise<UpdateCheckResult>;
    publishChecks: (checks: readonly UpdateCheckResult[]) => Promise<void>;
}
/**
 * Require merge resolution, dependency preparation, and one production build.
 * @param candidatePath - isolated candidate worktree.
 * @param dependencies - concrete minimal build operations.
 * @returns the complete passing check list.
 */
export declare function validateCandidate(candidatePath: string, dependencies: ValidationDependencies): Promise<readonly UpdateCheckResult[]>;
/**
 * Re-open candidate adaptation when a real validation gate finds a problem.
 * One build failure may return to a narrowly scoped compatibility repair.
 * @param candidatePath - isolated candidate worktree.
 * @param dependencies - concrete validation operations.
 * @param repair - stable Agent repair callback receiving failure evidence.
 * @param maxRepairs - bounded repair attempts before the update safely fails.
 * @returns the complete passing check list.
 */
export declare function validateCandidateWithRepairs(candidatePath: string, dependencies: ValidationDependencies, repair: (failure: string, attempt: number) => Promise<void>, maxRepairs?: number): Promise<readonly UpdateCheckResult[]>;
//# sourceMappingURL=validation.d.ts.map