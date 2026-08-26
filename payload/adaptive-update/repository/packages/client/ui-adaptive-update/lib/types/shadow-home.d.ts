/** Minimal private DSH Home for stable review and adaptation Agents. */
/**
 * Copy only the configuration required by a stable headless Agent.
 * @param realHome - user's real DSH Home.
 * @param controlRoot - plugin-owned sibling control directory.
 * @param jobId - active operation id.
 * @returns the isolated shadow Home path.
 */
export declare function createShadowHome(realHome: string, controlRoot: string, jobId: string): Promise<string>;
//# sourceMappingURL=shadow-home.d.ts.map