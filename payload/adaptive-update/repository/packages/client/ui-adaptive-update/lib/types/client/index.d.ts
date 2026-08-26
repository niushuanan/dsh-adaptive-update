/** Browser half registering the native Continuous Adaptation Settings page. */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type AdaptiveUpdateLocaleKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        'settings.adaptiveUpdate': AdaptiveUpdateLocaleKey;
    }
}
export declare const inject: string[];
/** Contribute one native Settings section. */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map