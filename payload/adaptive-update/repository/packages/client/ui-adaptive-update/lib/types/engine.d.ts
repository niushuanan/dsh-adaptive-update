/** Host-side single-operation coordinator and detached-worker job writer. */
import { type AdaptiveUpdateService } from './api.ts';
import type { StableCommand } from './agent-runner.ts';
import { UpdateStateStore } from './state.ts';
import { type IdleUpdateView, type UpdateSnapshot } from './types.ts';
/** Runtime command replayed after source cutover. */
export interface UpdateRuntime {
    command: string;
    args: readonly string[];
    cwd: string;
    baseUrl: string;
    currentPid: number;
    stableCommand: StableCommand;
}
/** Immutable job file consumed by the detached worker. */
export interface UpdateJob {
    schemaVersion: 1;
    jobId: string;
    repositoryRoot: string;
    controlRoot: string;
    dshHome: string;
    upstreamUrl: string;
    upstreamBranch: string;
    runtime: UpdateRuntime;
}
/** Engine configuration fixed by the running native plugin. */
export interface AdaptiveUpdateEngineOptions {
    controlRoot: string;
    repositoryRoot: string;
    dshHome: string;
    upstreamUrl: string;
    upstreamBranch: string;
    runtime: UpdateRuntime;
    isIdle: () => boolean;
}
/** Injectable checkout and process edges. */
export interface EngineDependencies {
    inspectCheckout: (repositoryRoot: string) => Promise<{
        commit: string;
        clean: boolean;
    }>;
    spawnWorker: (jobPath: string) => Promise<number>;
    stopWorker: (pid: number) => void;
    isProcessAlive: (pid: number) => boolean;
    newJobId: () => string;
}
/** Native Host service coordinating API state and one detached worker. */
export declare class AdaptiveUpdateEngine implements AdaptiveUpdateService {
    private readonly options;
    private readonly store;
    private readonly dependencies;
    constructor(options: AdaptiveUpdateEngineOptions, store: UpdateStateStore, dependencies: EngineDependencies);
    /** @returns persisted operation state or a checkout-derived idle view. */
    state(): Promise<IdleUpdateView | UpdateSnapshot>;
    /** @returns whether every root Agent is currently idle. */
    idle(): boolean;
    /**
     * Recover a dead applying worker, or close a dead pre-cutover operation.
     * @returns the refreshed durable state when one existed.
     */
    recover(): Promise<UpdateSnapshot | undefined>;
    /** Reserve and start one detached continuous-adaptation operation. */
    start(): Promise<UpdateSnapshot>;
}
//# sourceMappingURL=engine.d.ts.map