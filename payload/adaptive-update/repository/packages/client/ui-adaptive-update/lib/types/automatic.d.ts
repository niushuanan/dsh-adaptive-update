/** Persistent six-hour official-repository monitor for continuous adaptation. */
import type { AdaptiveUpdateService } from './api.ts';
import { type AutomaticUpdateView } from './types.ts';
/** HTTP operations exposed by the automatic-update controller. */
export interface AutomaticUpdateService {
    automaticState(): Promise<AutomaticUpdateView>;
    setAutomatic(enabled: boolean): Promise<AutomaticUpdateView>;
}
/** One official-ref observation used to decide whether adaptation is needed. */
export interface OfficialUpdateObservation {
    commit: string;
    integrated: boolean;
}
/**
 * Read the official branch tip without changing the live checkout.
 * @param repositoryRoot - current Xiaozhuang DSH checkout.
 * @param upstreamUrl - official Git repository.
 * @param upstreamBranch - official branch to observe.
 * @returns exact official commit and whether the local HEAD already contains it.
 */
export declare function inspectOfficialUpdate(repositoryRoot: string, upstreamUrl: string, upstreamBranch: string): Promise<OfficialUpdateObservation>;
/** Persistent monitor that checks immediately when enabled and then every configured interval. */
export declare class AutomaticUpdateMonitor implements AutomaticUpdateService {
    private readonly intervalMs;
    private readonly updater;
    private readonly inspectOfficial;
    private readonly store;
    private settings;
    private ready;
    private timer;
    private checking;
    constructor(controlRoot: string, intervalMs: number, updater: AdaptiveUpdateService, inspectOfficial: () => Promise<OfficialUpdateObservation>);
    /**
     * Load the durable preference and arm the interval.
     * @returns a disposer that stops the automatic monitor.
     */
    start(): () => void;
    /** Stop the in-process timer without changing the user's durable preference. */
    dispose(): void;
    /** @returns the current automatic-update preference and latest observation. */
    automaticState(): Promise<AutomaticUpdateView>;
    /** Persist a user toggle; enabling arms the timer and starts one check immediately. */
    setAutomatic(enabled: boolean): Promise<AutomaticUpdateView>;
    private view;
    private arm;
    private checkNow;
}
//# sourceMappingURL=automatic.d.ts.map