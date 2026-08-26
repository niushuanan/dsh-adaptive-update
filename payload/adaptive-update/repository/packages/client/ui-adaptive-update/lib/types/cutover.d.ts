/** Stop-snapshot-switch-restart transaction with automatic rollback. */
/** Immutable inputs pinned by the verified candidate. */
export interface CutoverOptions {
    repositoryRoot: string;
    dshHome: string;
    controlRoot: string;
    jobId: string;
    currentCommit: string;
    candidateCommit: string;
    currentPid: number;
}
/** Process, Git, and data operations owned by the detached worker. */
export interface CutoverDependencies {
    isCheckoutClean: (repositoryRoot: string) => Promise<boolean>;
    waitForIdle: () => Promise<void>;
    stopCurrent: (pid: number) => Promise<void>;
    createSnapshot: (dshHome: string, controlRoot: string, jobId: string) => Promise<string>;
    advanceCheckout: (repositoryRoot: string, commit: string) => Promise<void>;
    waitForReadiness: () => Promise<boolean>;
    spawnRuntime: () => Promise<number>;
    stopCandidate: (pid: number | undefined) => Promise<void>;
    restoreSnapshot: (dshHome: string, snapshotPath: string, controlRoot: string, jobId: string) => Promise<void>;
}
/** Outcome returned after either the candidate or restored product is ready. */
export type CutoverResult = {
    status: 'completed' | 'rolled-back';
    snapshotPath: string;
};
/** Recovery dependencies add an authoritative current checkout read. */
export type CutoverRecoveryDependencies = CutoverDependencies & {
    currentHead: (repositoryRoot: string) => Promise<string>;
};
/**
 * Apply a verified candidate only after the usable product is idle and stopped.
 * @param options - pinned code, data, and process identity.
 * @param dependencies - concrete external-worker operations.
 * @returns completed or rolled-back only after real readiness.
 */
export declare function applyCandidate(options: CutoverOptions, dependencies: CutoverDependencies): Promise<CutoverResult>;
/**
 * Resume an interrupted applying phase from its durable transaction facts.
 * @param options - cutover inputs plus the snapshot published before checkout advance.
 * @param dependencies - external-worker operations and current HEAD reader.
 * @returns completed candidate or fully restored previous product.
 */
export declare function recoverInterruptedCutover(options: CutoverOptions & {
    snapshotPath?: string;
}, dependencies: CutoverRecoveryDependencies): Promise<CutoverResult>;
//# sourceMappingURL=cutover.d.ts.map