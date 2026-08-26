/** Stable-version headless Agent runner for candidate compatibility and adaptation. */
import { type CommandResult } from './process.ts';
/** Exact stable CLI invocation independent from the candidate source tree. */
export interface StableCommand {
    command: string;
    argsPrefix: readonly string[];
}
/** A stable Agent turn that exited without successful completion. */
export declare class StableAgentRunError extends Error {
    /** Whether the bounded Agent command reached its configured deadline. */
    readonly timedOut: boolean;
    /** Model-visible standard output captured for the compatibility report. */
    readonly output: string;
    constructor(result: CommandResult);
}
/**
 * Resolve the source-mode TypeScript loader from the stable checkout so the
 * Agent can run while its current directory is a dependency-free worktree.
 * @param command - launch vector captured from the live stable product.
 * @param repositoryRoot - stable checkout that owns the installed loader.
 * @returns launch vector independent from the review or candidate directory.
 */
export declare function pinStableCommand(command: StableCommand, repositoryRoot: string): StableCommand;
/**
 * Run one fixed-model stable DSH headless task in an isolated working tree and Home.
 * @param options - stable CLI, candidate directory, shadow Home, task, and optional process bound.
 * @returns the final assistant text from stdout.
 */
export declare function runStableAgent(options: StableCommand & {
    cwd: string;
    stableRoot: string;
    shadowHome: string;
    task: string;
    timeoutMs: number | null;
}): Promise<string>;
//# sourceMappingURL=agent-runner.d.ts.map