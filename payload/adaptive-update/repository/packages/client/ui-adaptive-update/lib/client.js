window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-adaptive-update",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		//#region \0dsh-css:dsh-source/packages/client/ui-adaptive-update/src/client/AdaptiveUpdateSection.module.css.mjs
		const css = ".pI7WWq_root{width:100%;color:var(--dsw-alias-label-primary);flex-direction:column;gap:18px;display:flex}.pI7WWq_header{justify-content:space-between;align-items:center;gap:16px;display:flex}.pI7WWq_header h2{margin:0;font-size:20px;font-weight:600;line-height:28px}.pI7WWq_phase{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:4px 10px;font-size:12px;line-height:18px}.pI7WWq_automatic{justify-content:flex-start;display:flex}.pI7WWq_automaticCapsule{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);min-height:36px;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border-radius:999px;align-items:center;gap:8px;padding:0 12px;font-size:13px;line-height:20px;display:inline-flex}.pI7WWq_automaticCapsule[aria-checked=true]{border-color:var(--dsw-alias-button-primary-fill);background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}.pI7WWq_automaticCapsule:disabled{opacity:.55;cursor:default}.pI7WWq_automaticCapsule:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3);outline:none}.pI7WWq_automaticDot{opacity:.5;background:currentColor;border-radius:50%;flex:none;width:7px;height:7px}.pI7WWq_automaticCapsule[aria-checked=true] .pI7WWq_automaticDot{opacity:1}.pI7WWq_automaticCapsule strong{font-size:12px;font-weight:600}.pI7WWq_commits{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;display:grid}.pI7WWq_commits>div{background:var(--dsw-alias-bg-module-platform);border-radius:12px;flex-direction:column;gap:8px;padding:14px 16px;display:flex}.pI7WWq_commits span,.pI7WWq_notice{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}.pI7WWq_commits code{font-size:13px}.pI7WWq_review{flex-direction:column;gap:12px;display:flex}.pI7WWq_metrics{flex-wrap:wrap;gap:8px;display:flex}.pI7WWq_metrics span{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:8px;padding:6px 10px;font-size:12px}.pI7WWq_checks{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0;padding:0;list-style:none;display:grid}.pI7WWq_checks li{color:var(--dsw-alias-label-secondary);align-items:center;gap:8px;font-size:13px;display:flex}.pI7WWq_dot{background:var(--dsw-alias-label-tertiary);border-radius:50%;flex:none;width:7px;height:7px}.pI7WWq_checks li[data-status=passed] .pI7WWq_dot{background:var(--dsw-alias-state-success-primary)}.pI7WWq_checks li[data-status=failed] .pI7WWq_dot{background:var(--dsw-alias-state-error-primary)}.pI7WWq_checks li[data-status=running] .pI7WWq_dot{background:var(--dsw-alias-button-primary-fill)}.pI7WWq_notice,.pI7WWq_error{margin:0}.pI7WWq_error{color:var(--dsw-alias-state-error-primary);font-size:13px;line-height:20px}.pI7WWq_actions{justify-content:flex-end;display:flex}.pI7WWq_actions button{background:var(--dsw-alias-button-primary-fill);height:36px;color:var(--dsw-alias-label-primary-foreground);font:inherit;cursor:pointer;border:none;border-radius:18px;padding:0 16px;font-size:14px}.pI7WWq_actions button:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}.pI7WWq_actions button:disabled{opacity:.45;cursor:default}.pI7WWq_actions button:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3);outline:none}@media (width<=720px){.pI7WWq_commits,.pI7WWq_checks{grid-template-columns:1fr}}";
		const tagId = "@deepseek-ai/dsh-client-ui-adaptive-update/AdaptiveUpdateSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-adaptive-update";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var AdaptiveUpdateSection_module_css_default = {
			"actions": "pI7WWq_actions",
			"automatic": "pI7WWq_automatic",
			"automaticCapsule": "pI7WWq_automaticCapsule",
			"automaticDot": "pI7WWq_automaticDot",
			"checks": "pI7WWq_checks",
			"commits": "pI7WWq_commits",
			"dot": "pI7WWq_dot",
			"error": "pI7WWq_error",
			"header": "pI7WWq_header",
			"metrics": "pI7WWq_metrics",
			"notice": "pI7WWq_notice",
			"phase": "pI7WWq_phase",
			"review": "pI7WWq_review",
			"root": "pI7WWq_root"
		};
		//#endregion
		//#region lib/types/client/AdaptiveUpdateSection.js
		/** Native Settings page for manual and automatic continuous adaptation. */
		const API = "/plugins/ui-adaptive-update/api";
		const PHASE_LABEL = {
			idle: "尚未开始",
			discovering: "正在确认官方版本",
			reviewing: "正在检查合并冲突",
			adapting: "正在处理兼容冲突",
			validating: "正在确认候选可构建",
			"waiting-for-idle": "候选可用，等待当前对话空闲",
			applying: "正在安全切换",
			completed: "更新已完成",
			failed: "本次更新未应用",
			"rolled-back": "已回到更新前版本"
		};
		function shortCommit(commit) {
			return commit?.slice(0, 12) ?? "—";
		}
		async function request(path, method = "GET") {
			const response = await fetch(`${API}/${path}`, { method });
			const value = await response.json();
			if (!response.ok) throw new Error(typeof value.error === "string" ? value.error : "请求失败");
			return value;
		}
		/** Settings section rendered through the native settings slot. */
		function AdaptiveUpdateSection(_props) {
			const [view, setView] = (0, react.useState)({ phase: "idle" });
			const [automatic, setAutomatic] = (0, react.useState)({
				enabled: false,
				checking: false,
				intervalHours: 6
			});
			const [savingAutomatic, setSavingAutomatic] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)();
			const refresh = (0, react.useCallback)(async () => {
				try {
					const [nextView, nextAutomatic] = await Promise.all([request("state"), request("automatic")]);
					setView(nextView);
					setAutomatic(nextAutomatic);
					setError(void 0);
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : String(cause));
				}
			}, []);
			(0, react.useEffect)(() => {
				refresh();
				const timer = window.setInterval(() => {
					refresh();
				}, 2e3);
				return () => {
					window.clearInterval(timer);
				};
			}, [refresh]);
			const active = ![
				"idle",
				"completed",
				"failed",
				"rolled-back"
			].includes(view.phase);
			const snapshot = view.phase === "idle" ? void 0 : view;
			const displayedCommit = view.phase === "completed" ? view.candidateCommit ?? view.currentCommit : view.currentCommit;
			let automaticStatus = "已关闭";
			if (savingAutomatic) automaticStatus = "保存中";
			else if (automatic.checking) automaticStatus = "检查中";
			else if (automatic.enabled) automaticStatus = "已开启";
			const start = async () => {
				setError(void 0);
				try {
					setView(await request("start", "POST"));
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : String(cause));
				}
			};
			const toggleAutomatic = async () => {
				setSavingAutomatic(true);
				setError(void 0);
				try {
					setAutomatic(await request(automatic.enabled ? "automatic/disable" : "automatic/enable", "POST"));
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : String(cause));
				} finally {
					setSavingAutomatic(false);
				}
			};
			return (0, react_jsx_runtime.jsxs)("section", {
				className: AdaptiveUpdateSection_module_css_default.root,
				"aria-labelledby": "adaptive-update-title",
				children: [
					(0, react_jsx_runtime.jsxs)("header", {
						className: AdaptiveUpdateSection_module_css_default.header,
						children: [(0, react_jsx_runtime.jsx)("h2", {
							id: "adaptive-update-title",
							children: "持续适配"
						}), (0, react_jsx_runtime.jsx)("span", {
							className: AdaptiveUpdateSection_module_css_default.phase,
							"data-phase": view.phase,
							children: PHASE_LABEL[view.phase] ?? view.phase
						})]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: AdaptiveUpdateSection_module_css_default.automatic,
						children: (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "switch",
							"aria-checked": automatic.enabled,
							className: AdaptiveUpdateSection_module_css_default.automaticCapsule,
							disabled: savingAutomatic,
							onClick: () => {
								toggleAutomatic();
							},
							children: [
								(0, react_jsx_runtime.jsx)("span", {
									"aria-hidden": "true",
									className: AdaptiveUpdateSection_module_css_default.automaticDot
								}),
								(0, react_jsx_runtime.jsxs)("span", { children: [
									"自动更新 · 每 ",
									automatic.intervalHours,
									" 小时"
								] }),
								(0, react_jsx_runtime.jsx)("strong", { children: automaticStatus })
							]
						})
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: AdaptiveUpdateSection_module_css_default.commits,
						children: [(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("span", { children: "当前版本" }), (0, react_jsx_runtime.jsx)("code", { children: shortCommit(displayedCommit) })] }), (0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("span", { children: "官方版本" }), (0, react_jsx_runtime.jsx)("code", { children: shortCommit(snapshot?.upstreamCommit) })] })]
					}),
					snapshot?.report !== void 0 && (0, react_jsx_runtime.jsx)("div", {
						className: AdaptiveUpdateSection_module_css_default.review,
						children: (0, react_jsx_runtime.jsxs)("div", {
							className: AdaptiveUpdateSection_module_css_default.metrics,
							children: [
								(0, react_jsx_runtime.jsxs)("span", { children: ["重叠文件 ", (0, react_jsx_runtime.jsx)("strong", { children: snapshot.report.overlappingFiles.length })] }),
								(0, react_jsx_runtime.jsxs)("span", { children: ["合并冲突 ", (0, react_jsx_runtime.jsx)("strong", { children: snapshot.report.conflictFiles.length })] }),
								(0, react_jsx_runtime.jsxs)("span", { children: ["影响插件 ", (0, react_jsx_runtime.jsx)("strong", { children: snapshot.report.impactedPlugins.length })] })
							]
						})
					}),
					snapshot?.checks.length !== void 0 && snapshot.checks.length > 0 && (0, react_jsx_runtime.jsx)("ul", {
						className: AdaptiveUpdateSection_module_css_default.checks,
						children: snapshot.checks.map((check) => (0, react_jsx_runtime.jsxs)("li", {
							"data-status": check.status,
							children: [(0, react_jsx_runtime.jsx)("span", {
								"aria-hidden": "true",
								className: AdaptiveUpdateSection_module_css_default.dot
							}), (0, react_jsx_runtime.jsx)("span", { children: check.label })]
						}, check.id))
					}),
					active && (0, react_jsx_runtime.jsx)("p", {
						className: AdaptiveUpdateSection_module_css_default.notice,
						children: "冲突处理在后台进行，当前版本可继续使用。只会在对话空闲且新版本可启动后切换。"
					}),
					error !== void 0 && (0, react_jsx_runtime.jsx)("p", {
						className: AdaptiveUpdateSection_module_css_default.error,
						role: "alert",
						children: error
					}),
					automatic.enabled && automatic.lastError !== void 0 && (0, react_jsx_runtime.jsxs)("p", {
						className: AdaptiveUpdateSection_module_css_default.error,
						role: "alert",
						children: ["自动检查：", automatic.lastError]
					}),
					snapshot?.error !== void 0 && (0, react_jsx_runtime.jsx)("p", {
						className: AdaptiveUpdateSection_module_css_default.error,
						role: "alert",
						children: snapshot.error
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: AdaptiveUpdateSection_module_css_default.actions,
						children: (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: active,
							onClick: () => {
								start();
							},
							children: active ? "正在处理" : "立即检查并适配"
						})
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client/locales.js
		/** Exact product copy for the native continuous-adaptation surface. */
		/** Simplified Chinese product copy for the Settings entry. */
		const zh = { nav: "持续适配" };
		/** English-locale product copy retaining the required Chinese product name. */
		const en = { nav: "持续适配" };
		//#endregion
		//#region lib/types/client/index.js
		/** Browser half registering the native Continuous Adaptation Settings page. */
		const NS = "settings.adaptiveUpdate";
		const inject = ["slots", "locale"];
		/** Contribute one native Settings section. */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-adaptive-update: dictionaries");
			const t = ctx.locale.bind(NS);
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "adaptive-update",
				order: 85,
				label: () => t("nav")
			}, AdaptiveUpdateSection));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map