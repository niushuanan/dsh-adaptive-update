/** Atomic durable state for the external adaptive-update worker. */
import { type UpdatePhase, type UpdateSnapshot } from './types.ts';
/** File-backed state store shared by the Host API and detached worker. */
export declare class UpdateStateStore {
    private readonly controlRoot;
    private readonly now;
    private readonly path;
    /**
     * @param controlRoot - plugin-owned directory outside the user's DSH Home.
     * @param now - timestamp source used for deterministic tests.
     */
    constructor(controlRoot: string, now?: () => string);
    /**
     * Read and validate the latest atomically persisted operation state.
     * @returns the last durable state, or undefined before the first run.
     */
    read(): Promise<UpdateSnapshot | undefined>;
    /**
     * Reserve the single operation slot and publish the discovering phase.
     * @param input - immutable job identity and starting source commit.
     * @returns the durable starting state.
     */
    begin(input: {
        jobId: string;
        currentCommit: string;
        workerPid: number;
    }): Promise<UpdateSnapshot>;
    /**
     * Publish one worker-owned phase transition.
     * @param jobId - operation that owns the current state.
     * @param phase - next durable phase.
     * @param patch - fields committed with the phase.
     * @returns the new durable state.
     */
    transition(jobId: string, phase: UpdatePhase, patch?: Partial<Omit<UpdateSnapshot, 'schemaVersion' | 'phase' | 'jobId' | 'startedAt' | 'updatedAt'>>): Promise<UpdateSnapshot>;
    private write;
}
//# sourceMappingURL=state.d.ts.map