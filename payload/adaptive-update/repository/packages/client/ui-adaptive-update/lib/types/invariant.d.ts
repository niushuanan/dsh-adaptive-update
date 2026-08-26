/** Package-owned invariant companion for native continuous adaptation. */
import type { Context } from '@deepseek-ai/cordis';
export declare const name = "client-ui-adaptive-update-invariant";
export declare const inject: string[];
/** Reserve native-updater package ownership in the invariant registry. */
export declare const apply: (ctx: Context) => Promise<() => void>;
//# sourceMappingURL=invariant.d.ts.map