//#region src/invariant.ts
const PACKAGE_NAME = "@deepseek-ai/dsh-client-ui-adaptive-update";
const name = "client-ui-adaptive-update-invariant";
const inject = ["invariants"];
/**
* No runtime invariant: the updater contributes no session events and owns no
* in-process service state; every durable fact lives in the repository refs
* and the on-disk candidate directory, not in a runtime event stream.
*/
const install = () => {};
/** Reserve native-updater package ownership in the invariant registry. */
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
