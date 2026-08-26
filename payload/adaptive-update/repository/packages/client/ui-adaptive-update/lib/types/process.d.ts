/** Child-process execution with caller-selected bounds used by the detached updater. */
/** Independent facts reported for one child process. */
export interface CommandResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    signal: NodeJS.Signals | null;
    timedOut: boolean;
}
/**
 * Remove credential-named variables before launching conflict-resolution and build children.
 * @param source - ambient environment to filter.
 * @returns the environment entries safe to place in detached job processes.
 */
export declare function sanitizedProcessEnv(source?: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
/**
 * Run one child and await complete process quiescence.
 * @param command - executable name or absolute path.
 * @param args - exact argument vector.
 * @param options - working directory, environment, and timeout; null disables the timeout.
 * @returns stdout, stderr, exit, signal, and timeout as orthogonal outcomes.
 */
export declare function runCommand(command: string, args: readonly string[], options: {
    cwd: string;
    env?: NodeJS.ProcessEnv;
    timeoutMs?: number | null;
    killGraceMs?: number;
}): Promise<CommandResult>;
/**
 * Require a successful command result.
 * @param label - operation name included in diagnostics.
 * @param result - completed command result.
 */
export declare function requireCommand(label: string, result: CommandResult): void;
//# sourceMappingURL=process.d.ts.map