/** Loopback HTTP API for native continuous-adaptation actions. */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AutomaticUpdateService } from './automatic.ts';
import type { IdleUpdateView, UpdateSnapshot } from './types.ts';
/** Fixed same-origin route owned by the native plugin. */
export declare const ADAPTIVE_UPDATE_API_ROUTE = "/plugins/ui-adaptive-update/api";
/** Host operations consumed by the HTTP carrier. */
export interface AdaptiveUpdateService {
    state(): Promise<IdleUpdateView | UpdateSnapshot>;
    start(): Promise<UpdateSnapshot>;
    idle(): boolean;
}
/** Expected product/API failure with an explicit HTTP status. */
export declare class AdaptiveUpdateApiError extends Error {
    readonly status: number;
    constructor(status: number, message: string);
}
/**
 * Serve state, manual start, automatic-update, and worker-only idle probes on loopback.
 * @param req - Host HTTP request.
 * @param res - Host HTTP response.
 * @param service - continuous-adaptation engine.
 * @param automatic - persistent official-repository monitor.
 */
export declare function adaptiveUpdateApiHandler(req: IncomingMessage, res: ServerResponse, service: AdaptiveUpdateService, automatic?: AutomaticUpdateService): Promise<void>;
//# sourceMappingURL=api.d.ts.map