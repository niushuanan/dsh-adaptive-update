/** Pure repository-diff projection used by the compatibility report. */
/**
 * Project changed paths into fixed risk identifiers ordered by product impact.
 * @param paths - repository-relative paths changed by either merge side.
 * @returns unique risk identifiers in product-impact order.
 */
export declare function riskAreasFor(paths: readonly string[]): string[];
/**
 * Resolve package names for files changed on both sides of the merge base.
 * @param repositoryRoot - current source checkout.
 * @param paths - overlapping or directly conflicting file paths.
 * @returns unique manifest names in lexical order.
 */
export declare function impactedPluginNames(repositoryRoot: string, paths: readonly string[]): Promise<string[]>;
//# sourceMappingURL=review.d.ts.map