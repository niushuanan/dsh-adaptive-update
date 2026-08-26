/** Concrete detached-worker operations for one conflict-focused continuous adaptation. */
import type { UpdateJob } from './engine.ts';
/**
 * Accept only an Agent result that explicitly declares its atomic task complete.
 * @param output - stable Agent final stdout.
 * @returns final report text without the transport marker.
 */
export declare function completedAgentOutput(output: string): string;
/**
 * Run one scope-matched compatibility turn and require an atomic completion marker.
 * @param originalTask - complete task repeated for every continuation turn.
 * @param runTurn - one stable Agent invocation carrying its caller-selected timeout policy.
 * @returns the completed report without its transport marker.
 */
export declare function completeAgentTurns(originalTask: string, runTurn: (task: string) => Promise<string>): Promise<string>;
/**
 * Parse the secret-free immutable job written by the live Host plugin.
 * @param value - untrusted JSON value read from the job file.
 * @returns a validated detached-worker job.
 */
export declare function parseUpdateJob(value: unknown): UpdateJob;
/**
 * Replay absolute source paths under another worktree.
 * @param args - original process argument vector.
 * @param repositoryRoot - source checkout used by the running product.
 * @param targetRoot - review or candidate checkout used by the replayed process.
 * @returns the replay-safe argument vector for the target checkout.
 */
export declare function repositoryRuntimeArgs(args: readonly string[], repositoryRoot: string, targetRoot: string): string[];
/**
 * Execute one immutable detached-worker job to a ready candidate or rollback.
 * @param job - validated immutable update request created by the live Host.
 */
export declare function runUpdateJob(job: UpdateJob): Promise<void>;
/**
 * Read and execute a job file supplied as the worker's only argument.
 * @param jobPath - absolute private JSON job path.
 */
export declare function runUpdateJobFile(jobPath: string): Promise<void>;
/**
 * Create a stable unique job id used by the live Host engine.
 * @returns a filesystem- and Git-ref-safe operation identifier.
 */
export declare function newUpdateJobId(): string;
//# sourceMappingURL=worker-runtime.d.ts.map