/** Bounded cleanup for adaptive-update-owned transient artifacts. */
/**
 * Remove completed transient artifacts and all but one previous-data snapshot.
 * @param controlRoot - fixed plugin-owned control directory.
 * @param options - complete snapshot path retained for rollback.
 * @returns removal counts for the update report.
 */
export declare function pruneOwnedArtifacts(controlRoot: string, options?: {
    keepSnapshot?: string;
}): Promise<{
    removedTransient: number;
    removedSnapshots: number;
}>;
//# sourceMappingURL=retention.d.ts.map