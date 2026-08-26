/** Copy-on-write whole-Home snapshot used only during the short cutover. */
/**
 * Create one filesystem copy-on-write snapshot after the current DSH stops.
 * @param dshHome - real user data directory.
 * @param controlRoot - plugin-owned sibling directory.
 * @param jobId - operation id used as the snapshot directory name.
 * @returns complete snapshot path.
 */
export declare function createDataSnapshot(dshHome: string, controlRoot: string, jobId: string): Promise<string>;
/**
 * Atomically replace candidate-mutated data with its pre-cutover snapshot.
 * @param dshHome - real user data directory.
 * @param snapshotPath - snapshot created for this job.
 * @param controlRoot - plugin-owned sibling directory.
 * @param jobId - operation id used for failed-data quarantine.
 */
export declare function restoreDataSnapshot(dshHome: string, snapshotPath: string, controlRoot: string, jobId: string): Promise<void>;
//# sourceMappingURL=snapshot.d.ts.map