/** Native Host half of the continuous-adaptation plugin. */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
/** Native updater configuration; defaults follow the official DSH repository. */
export interface Config {
    /** Official Git repository inspected and fetched by the detached worker. */
    upstreamUrl: string;
    /** Official branch pinned once at the beginning of an update operation. */
    upstreamBranch: string;
    /** Local clean source checkout; defaults to the running process directory. */
    repositoryRoot?: string;
    /** Delay between automatic official-repository checks. */
    automaticCheckIntervalMs: number;
}
/** Native updater configuration schema. */
export declare const Config: z<Config>;
/** Services required by the Host API and idle barrier. */
export declare const inject: string[];
/** Register the native API and detached-worker recovery for one web runtime. */
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map