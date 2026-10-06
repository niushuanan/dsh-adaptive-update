window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-adaptive-update",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region src/client/AdaptiveUpdateIcon.tsx
		/** Retains the plugin's original continuous adaptation artwork. */
		const IconAdaptiveUpdate = ({ size = 16, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
			width: size,
			height: size,
			className,
			viewBox: "0 0 16 16",
			fill: "none",
			xmlns: "http://www.w3.org/2000/svg",
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
				d: "M8 1.25a6.75 6.75 0 0 1 5.64 3.04l.42-.94 1.19.53-1.15 2.57a.65.65 0 0 1-.86.33l-2.57-1.15.53-1.19.99.44A5.45 5.45 0 0 0 8 2.55a5.43 5.43 0 0 0-4.11 1.87l-.98-.86A6.73 6.73 0 0 1 8 1.25Zm4.11 10.33.98.86A6.73 6.73 0 0 1 8 14.75a6.75 6.75 0 0 1-5.64-3.04l-.42.94-1.19-.53 1.15-2.57a.65.65 0 0 1 .86-.33l2.57 1.15-.53 1.19-.99-.44A5.45 5.45 0 0 0 8 13.45a5.43 5.43 0 0 0 4.11-1.87Z",
				fill: "currentColor"
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
				d: "m8 5 3 3-3 3-3-3 3-3Zm0 1.7L6.7 8 8 9.3 9.3 8 8 6.7Z",
				fill: "currentColor"
			})]
		});
		//#endregion
		//#region \0dsh-css:/Users/zhuanghongkai/Desktop/迭代DSH/xiaozhuang-dsh-upgrade-20261006/plugins/adaptive-update/src/client/AdaptiveUpdateSection.module.css.mjs
		const css = ".oQUOOG_root{width:100%;color:var(--dsw-alias-label-primary);flex-direction:column;gap:18px;display:flex}.oQUOOG_phase{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:4px 10px;font-size:12px;line-height:18px}.oQUOOG_automatic{justify-content:flex-start;display:flex}.oQUOOG_automaticCapsule{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);min-height:36px;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border-radius:999px;align-items:center;gap:8px;padding:0 12px;font-size:13px;line-height:20px;display:inline-flex}.oQUOOG_automaticCapsule[aria-checked=true]{border-color:var(--dsw-alias-button-primary-fill);background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}.oQUOOG_automaticCapsule:disabled{opacity:.55;cursor:default}.oQUOOG_automaticCapsule:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3);outline:none}.oQUOOG_automaticDot{opacity:.5;background:currentColor;border-radius:50%;flex:none;width:7px;height:7px}.oQUOOG_automaticCapsule[aria-checked=true] .oQUOOG_automaticDot{opacity:1}.oQUOOG_automaticCapsule strong{font-size:12px;font-weight:600}.oQUOOG_commits{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;display:grid}.oQUOOG_commits>div{background:var(--dsw-alias-bg-module-platform);border-radius:12px;flex-direction:column;gap:8px;padding:14px 16px;display:flex}.oQUOOG_commits span,.oQUOOG_notice{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}.oQUOOG_commits code{font-size:13px}.oQUOOG_review{flex-direction:column;gap:12px;display:flex}.oQUOOG_metrics{flex-wrap:wrap;gap:8px;display:flex}.oQUOOG_metrics span{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:8px;padding:6px 10px;font-size:12px}.oQUOOG_checks{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0;padding:0;list-style:none;display:grid}.oQUOOG_checks li{color:var(--dsw-alias-label-secondary);align-items:center;gap:8px;font-size:13px;display:flex}.oQUOOG_dot{background:var(--dsw-alias-label-tertiary);border-radius:50%;flex:none;width:7px;height:7px}.oQUOOG_checks li[data-status=passed] .oQUOOG_dot{background:var(--dsw-alias-state-success-primary)}.oQUOOG_checks li[data-status=failed] .oQUOOG_dot{background:var(--dsw-alias-state-error-primary)}.oQUOOG_checks li[data-status=running] .oQUOOG_dot{background:var(--dsw-alias-button-primary-fill)}.oQUOOG_notice,.oQUOOG_error{margin:0}.oQUOOG_error{color:var(--dsw-alias-state-error-primary);font-size:13px;line-height:20px}.oQUOOG_actions{justify-content:flex-end;display:flex}.oQUOOG_actions button{background:var(--dsw-alias-button-primary-fill);height:36px;color:var(--dsw-alias-label-primary-foreground);font:inherit;cursor:pointer;border:none;border-radius:18px;padding:0 16px;font-size:14px}.oQUOOG_actions button:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}.oQUOOG_actions button:disabled{opacity:.45;cursor:default}.oQUOOG_actions button:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3);outline:none}@media (width<=720px){.oQUOOG_commits,.oQUOOG_checks{grid-template-columns:1fr}}";
		const tagId = "@deepseek-ai/dsh-client-ui-adaptive-update/AdaptiveUpdateSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-adaptive-update";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var AdaptiveUpdateSection_module_css_default = {
			"actions": "oQUOOG_actions",
			"automatic": "oQUOOG_automatic",
			"automaticCapsule": "oQUOOG_automaticCapsule",
			"automaticDot": "oQUOOG_automaticDot",
			"checks": "oQUOOG_checks",
			"commits": "oQUOOG_commits",
			"dot": "oQUOOG_dot",
			"error": "oQUOOG_error",
			"metrics": "oQUOOG_metrics",
			"notice": "oQUOOG_notice",
			"phase": "oQUOOG_phase",
			"review": "oQUOOG_review",
			"root": "oQUOOG_root"
		};
		//#endregion
		//#region src/client/AdaptiveUpdateSection.tsx
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
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: AdaptiveUpdateSection_module_css_default.root,
				"aria-labelledby": "adaptive-update-title",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SettingsSectionHeader, {
						title: "持续适配",
						titleId: "adaptive-update-title",
						actions: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: AdaptiveUpdateSection_module_css_default.phase,
							"data-phase": view.phase,
							children: PHASE_LABEL[view.phase] ?? view.phase
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: AdaptiveUpdateSection_module_css_default.automatic,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "switch",
							"aria-checked": automatic.enabled,
							className: AdaptiveUpdateSection_module_css_default.automaticCapsule,
							disabled: savingAutomatic,
							onClick: () => {
								toggleAutomatic();
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									"aria-hidden": "true",
									className: AdaptiveUpdateSection_module_css_default.automaticDot
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
									"自动更新 · 每 ",
									automatic.intervalHours,
									" 小时"
								] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: automaticStatus })
							]
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: AdaptiveUpdateSection_module_css_default.commits,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "当前版本" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: shortCommit(displayedCommit) })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "官方版本" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: shortCommit(snapshot?.upstreamCommit) })] })]
					}),
					snapshot?.report !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: AdaptiveUpdateSection_module_css_default.review,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: AdaptiveUpdateSection_module_css_default.metrics,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: ["重叠文件 ", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: snapshot.report.overlappingFiles.length })] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: ["合并冲突 ", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: snapshot.report.conflictFiles.length })] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: ["影响插件 ", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: snapshot.report.impactedPlugins.length })] })
							]
						})
					}),
					snapshot?.checks.length !== void 0 && snapshot.checks.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: AdaptiveUpdateSection_module_css_default.checks,
						children: snapshot.checks.map((check) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
							"data-status": check.status,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								"aria-hidden": "true",
								className: AdaptiveUpdateSection_module_css_default.dot
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: check.label })]
						}, check.id))
					}),
					active && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: AdaptiveUpdateSection_module_css_default.notice,
						children: "冲突处理在后台进行，当前版本可继续使用。只会在对话空闲且新版本可启动后切换。"
					}),
					error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: AdaptiveUpdateSection_module_css_default.error,
						role: "alert",
						children: error
					}),
					automatic.enabled && automatic.lastError !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: AdaptiveUpdateSection_module_css_default.error,
						role: "alert",
						children: ["自动检查：", automatic.lastError]
					}),
					snapshot?.error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: AdaptiveUpdateSection_module_css_default.error,
						role: "alert",
						children: snapshot.error
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: AdaptiveUpdateSection_module_css_default.actions,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
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
		//#region src/client/locales.ts
		/** Exact product copy for the native continuous-adaptation surface. */
		/** Simplified Chinese product copy for the Settings entry. */
		const zh = { nav: "持续适配" };
		/** English-locale product copy retaining the required Chinese product name. */
		const en = { nav: "持续适配" };
		//#endregion
		//#region src/client/index.ts
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
			ctx.slots.inject("settings.section.icon", () => ctx.slots.register({
				name: "settings.section.icon",
				key: "adaptive-update"
			}, IconAdaptiveUpdate));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map