import { spawn } from "node:child_process";
import { closeSync, mkdirSync, openSync } from "node:fs";
import { fileURLToPath } from "node:url";
import z from "@deepseek-ai/schemastery";
import { resolveDshHome } from "@deepseek-ai/dsh-home-paths";
import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
//#region src/api.ts
/** Fixed same-origin route owned by the native plugin. */
const ADAPTIVE_UPDATE_API_ROUTE = "/plugins/ui-adaptive-update/api";
/** Expected product/API failure with an explicit HTTP status. */
var AdaptiveUpdateApiError = class extends Error {
	status;
	constructor(status, message) {
		super(message);
		this.status = status;
	}
};
function sendJson(res, status, body) {
	res.statusCode = status;
	res.setHeader("Content-Type", "application/json; charset=utf-8");
	res.setHeader("Cache-Control", "no-store");
	res.end(JSON.stringify(body));
}
function isLoopbackRequest(req) {
	const authority = req.headers.host ?? "";
	const host = authority.startsWith("[") ? authority.slice(1, authority.indexOf("]")) : authority.split(":")[0] ?? "";
	if (host !== "localhost" && host !== "::1" && !host.startsWith("127.")) return false;
	const site = req.headers["sec-fetch-site"];
	return site === void 0 || site === "same-origin" || site === "none";
}
/**
* Serve state, manual start, automatic-update, and worker-only idle probes on loopback.
* @param req - Host HTTP request.
* @param res - Host HTTP response.
* @param service - continuous-adaptation engine.
* @param automatic - persistent official-repository monitor.
*/
async function adaptiveUpdateApiHandler(req, res, service, automatic) {
	if (!isLoopbackRequest(req)) {
		sendJson(res, 403, { error: "持续适配仅能在本机使用" });
		return;
	}
	const path = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
	try {
		if (req.method === "GET" && path === `/plugins/ui-adaptive-update/api/state`) {
			sendJson(res, 200, await service.state());
			return;
		}
		if (req.method === "POST" && path === `/plugins/ui-adaptive-update/api/start`) {
			sendJson(res, 202, await service.start());
			return;
		}
		if (req.method === "GET" && path === `/plugins/ui-adaptive-update/api/automatic` && automatic !== void 0) {
			sendJson(res, 200, await automatic.automaticState());
			return;
		}
		if (req.method === "POST" && path === `/plugins/ui-adaptive-update/api/automatic/enable` && automatic !== void 0) {
			sendJson(res, 200, await automatic.setAutomatic(true));
			return;
		}
		if (req.method === "POST" && path === `/plugins/ui-adaptive-update/api/automatic/disable` && automatic !== void 0) {
			sendJson(res, 200, await automatic.setAutomatic(false));
			return;
		}
		if (req.method === "GET" && path === `/plugins/ui-adaptive-update/api/idle`) {
			sendJson(res, 200, { idle: service.idle() });
			return;
		}
		sendJson(res, 404, { error: "not found" });
	} catch (error) {
		sendJson(res, error instanceof AdaptiveUpdateApiError ? error.status : 500, { error: error instanceof Error ? error.message : String(error) });
	}
}
//#endregion
//#region src/process.ts
/** Child-process execution with caller-selected bounds used by the detached updater. */
const MAX_CAPTURE_BYTES = 8 * 1024 * 1024;
const SECRET_NAME = /(KEY|SECRET|TOKEN|PASSWORD)/iu;
/**
* Remove credential-named variables before launching conflict-resolution and build children.
* @param source - ambient environment to filter.
* @returns the environment entries safe to place in detached job processes.
*/
function sanitizedProcessEnv(source = process.env) {
	return Object.fromEntries(Object.entries(source).filter(([name]) => !SECRET_NAME.test(name)));
}
/**
* Run one child and await complete process quiescence.
* @param command - executable name or absolute path.
* @param args - exact argument vector.
* @param options - working directory, environment, and timeout; null disables the timeout.
* @returns stdout, stderr, exit, signal, and timeout as orthogonal outcomes.
*/
async function runCommand(command, args, options) {
	const child = spawn(command, [...args], {
		cwd: options.cwd,
		env: options.env ?? sanitizedProcessEnv(),
		stdio: [
			"ignore",
			"pipe",
			"pipe"
		]
	});
	let stdout = Buffer.alloc(0);
	let stderr = Buffer.alloc(0);
	let timedOut = false;
	const append = (current, chunk) => {
		const combined = Buffer.concat([current, chunk]);
		return combined.byteLength <= MAX_CAPTURE_BYTES ? combined : combined.subarray(combined.byteLength - MAX_CAPTURE_BYTES);
	};
	child.stdout.on("data", (chunk) => {
		stdout = append(stdout, chunk);
	});
	child.stderr.on("data", (chunk) => {
		stderr = append(stderr, chunk);
	});
	let forcedStop;
	let timeout;
	if (options.timeoutMs !== null) {
		timeout = setTimeout(() => {
			timedOut = true;
			child.kill("SIGTERM");
			forcedStop = setTimeout(() => {
				child.kill("SIGKILL");
			}, options.killGraceMs ?? 5e3);
			forcedStop.unref();
		}, options.timeoutMs ?? 12e4);
		timeout.unref();
	}
	const result = await new Promise((resolve, reject) => {
		child.once("error", reject);
		child.once("close", (exitCode, signal) => {
			resolve({
				exitCode,
				signal
			});
		});
	}).finally(() => {
		if (timeout !== void 0) clearTimeout(timeout);
		if (forcedStop !== void 0) clearTimeout(forcedStop);
	});
	return {
		stdout: stdout.toString("utf8"),
		stderr: stderr.toString("utf8"),
		exitCode: result.exitCode,
		signal: result.signal,
		timedOut
	};
}
/**
* Require a successful command result.
* @param label - operation name included in diagnostics.
* @param result - completed command result.
*/
function requireCommand(label, result) {
	if (!result.timedOut && result.signal === null && result.exitCode === 0) return;
	const detail = result.stderr.trim() || result.stdout.trim() || "no output";
	throw new Error(`${label} failed (exit=${String(result.exitCode)}, signal=${String(result.signal)}, timedOut=${String(result.timedOut)}): ${detail}`);
}
//#endregion
//#region src/types.ts
/**
* Determine whether a phase still owns the single operation slot.
* @param phase - persisted update lifecycle phase.
* @returns true while the detached operation remains active.
*/
function isActiveUpdatePhase(phase) {
	return phase !== "completed" && phase !== "failed" && phase !== "rolled-back";
}
//#endregion
//#region src/automatic.ts
/** Persistent six-hour official-repository monitor for continuous adaptation. */
const SETTINGS_FILE = "automatic.json";
const COMMIT$1 = /^[a-f0-9]{40}$/u;
const HOUR_MS = 3600 * 1e3;
function parseSettings(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("持续适配自动更新设置无效");
	const settings = value;
	if (settings.schemaVersion !== 1 || typeof settings.enabled !== "boolean" || settings.lastCheckedAt !== void 0 && Number.isNaN(Date.parse(settings.lastCheckedAt)) || settings.lastSeenCommit !== void 0 && !COMMIT$1.test(settings.lastSeenCommit) || settings.lastError !== void 0 && typeof settings.lastError !== "string") throw new Error("持续适配自动更新设置无效");
	return settings;
}
function withoutLastError(settings) {
	const copy = { ...settings };
	delete copy.lastError;
	return copy;
}
var AutomaticUpdateStore = class {
	controlRoot;
	path;
	constructor(controlRoot) {
		this.controlRoot = controlRoot;
		this.path = join(controlRoot, SETTINGS_FILE);
	}
	async read() {
		const raw = await readFile(this.path, "utf8").catch((error) => {
			if (error.code === "ENOENT") return void 0;
			throw error;
		});
		if (raw === void 0) return {
			schemaVersion: 1,
			enabled: false
		};
		try {
			return parseSettings(JSON.parse(raw));
		} catch (error) {
			if (error instanceof Error && error.message === "持续适配自动更新设置无效") throw error;
			throw new Error("持续适配自动更新设置无效");
		}
	}
	async write(settings) {
		await mkdir(this.controlRoot, {
			recursive: true,
			mode: 448
		});
		const temporary = join(this.controlRoot, `.automatic-${randomUUID()}.tmp`);
		try {
			await writeFile(temporary, `${JSON.stringify(settings, null, 2)}\n`, {
				encoding: "utf8",
				flag: "wx",
				mode: 384
			});
			await rename(temporary, this.path);
		} finally {
			await unlink(temporary).catch(() => void 0);
		}
		return settings;
	}
};
/**
* Read the official branch tip without changing the live checkout.
* @param repositoryRoot - current Xiaozhuang DSH checkout.
* @param upstreamUrl - official Git repository.
* @param upstreamBranch - official branch to observe.
* @returns exact official commit and whether the local HEAD already contains it.
*/
async function inspectOfficialUpdate(repositoryRoot, upstreamUrl, upstreamBranch) {
	const remote = await runCommand("git", [
		"ls-remote",
		"--heads",
		upstreamUrl,
		`refs/heads/${upstreamBranch}`
	], {
		cwd: repositoryRoot,
		timeoutMs: 3e4
	});
	requireCommand("git ls-remote official DSH", remote);
	const commit = remote.stdout.trim().split(/\s+/u)[0] ?? "";
	if (!COMMIT$1.test(commit)) throw new Error("官方 DSH 分支没有返回有效提交");
	if ((await runCommand("git", [
		"cat-file",
		"-e",
		`${commit}^{commit}`
	], {
		cwd: repositoryRoot,
		timeoutMs: 3e4
	})).exitCode !== 0) return {
		commit,
		integrated: false
	};
	const ancestor = await runCommand("git", [
		"merge-base",
		"--is-ancestor",
		commit,
		"HEAD"
	], {
		cwd: repositoryRoot,
		timeoutMs: 3e4
	});
	if (ancestor.exitCode !== 0 && ancestor.exitCode !== 1) requireCommand("git merge-base official DSH", ancestor);
	return {
		commit,
		integrated: ancestor.exitCode === 0
	};
}
/** Persistent monitor that checks immediately when enabled and then every configured interval. */
var AutomaticUpdateMonitor = class {
	intervalMs;
	updater;
	inspectOfficial;
	store;
	settings = {
		schemaVersion: 1,
		enabled: false
	};
	ready = Promise.resolve();
	timer;
	checking = false;
	constructor(controlRoot, intervalMs, updater, inspectOfficial) {
		this.intervalMs = intervalMs;
		this.updater = updater;
		this.inspectOfficial = inspectOfficial;
		this.store = new AutomaticUpdateStore(controlRoot);
	}
	/**
	* Load the durable preference and arm the interval.
	* @returns a disposer that stops the automatic monitor.
	*/
	start() {
		this.ready = this.store.read().then((settings) => {
			this.settings = settings;
			this.arm();
			if (settings.enabled) this.checkNow();
		}).catch((error) => {
			this.settings = {
				schemaVersion: 1,
				enabled: false,
				lastError: error instanceof Error ? error.message : String(error)
			};
		});
		return () => {
			this.dispose();
		};
	}
	/** Stop the in-process timer without changing the user's durable preference. */
	dispose() {
		if (this.timer !== void 0) clearInterval(this.timer);
		this.timer = void 0;
	}
	/** @returns the current automatic-update preference and latest observation. */
	async automaticState() {
		await this.ready;
		return this.view();
	}
	/** Persist a user toggle; enabling arms the timer and starts one check immediately. */
	async setAutomatic(enabled) {
		await this.ready;
		this.settings = await this.store.write({
			...withoutLastError(this.settings),
			enabled
		});
		this.arm();
		if (enabled) this.checkNow();
		return this.view();
	}
	view() {
		return {
			enabled: this.settings.enabled,
			checking: this.checking,
			intervalHours: this.intervalMs / HOUR_MS,
			...this.settings.lastCheckedAt === void 0 ? {} : { lastCheckedAt: this.settings.lastCheckedAt },
			...this.settings.lastSeenCommit === void 0 ? {} : { lastSeenCommit: this.settings.lastSeenCommit },
			...this.settings.lastError === void 0 ? {} : { lastError: this.settings.lastError }
		};
	}
	arm() {
		if (this.timer !== void 0) clearInterval(this.timer);
		this.timer = void 0;
		if (!this.settings.enabled) return;
		this.timer = setInterval(() => {
			this.checkNow();
		}, this.intervalMs);
		this.timer.unref();
	}
	async checkNow() {
		await this.ready;
		if (!this.settings.enabled || this.checking) return;
		this.checking = true;
		try {
			const official = await this.inspectOfficial();
			if (!this.settings.enabled) return;
			this.settings = await this.store.write({
				...withoutLastError(this.settings),
				lastCheckedAt: (/* @__PURE__ */ new Date()).toISOString(),
				lastSeenCommit: official.commit
			});
			const operation = await this.updater.state();
			if (official.integrated) return;
			if (operation.phase !== "idle") {
				if (isActiveUpdatePhase(operation.phase) || operation.phase === "completed" && operation.upstreamCommit === official.commit) return;
			}
			if (!this.settings.enabled) return;
			await this.updater.start();
		} catch (error) {
			if (!this.settings.enabled) return;
			this.settings = await this.store.write({
				...this.settings,
				lastError: error instanceof Error ? error.message : String(error)
			}).catch(() => this.settings);
		} finally {
			this.checking = false;
		}
	}
};
//#endregion
//#region src/engine.ts
/** Host-side single-operation coordinator and detached-worker job writer. */
async function writeJob(path, job) {
	const directory = dirname(path);
	await mkdir(directory, {
		recursive: true,
		mode: 448
	});
	const temporary = join(directory, `.job-${randomUUID()}.tmp`);
	const handle = await open(temporary, "wx", 384);
	try {
		await handle.writeFile(`${JSON.stringify(job, null, 2)}\n`, "utf8");
	} finally {
		await handle.close();
	}
	try {
		await rename(temporary, path);
	} finally {
		await unlink(temporary).catch(() => void 0);
	}
}
/** Native Host service coordinating API state and one detached worker. */
var AdaptiveUpdateEngine = class {
	options;
	store;
	dependencies;
	constructor(options, store, dependencies) {
		this.options = options;
		this.store = store;
		this.dependencies = dependencies;
	}
	/** @returns persisted operation state or a checkout-derived idle view. */
	async state() {
		const current = await this.store.read();
		if (current !== void 0) return current;
		return {
			phase: "idle",
			currentCommit: (await this.dependencies.inspectCheckout(this.options.repositoryRoot)).commit
		};
	}
	/** @returns whether every root Agent is currently idle. */
	idle() {
		return this.options.isIdle();
	}
	/**
	* Recover a dead applying worker, or close a dead pre-cutover operation.
	* @returns the refreshed durable state when one existed.
	*/
	async recover() {
		const current = await this.store.read();
		if (current === void 0 || !isActiveUpdatePhase(current.phase)) return current;
		if (this.dependencies.isProcessAlive(current.workerPid)) return current;
		if (current.phase !== "applying") return this.store.transition(current.jobId, "failed", { error: "上一次更新进程已退出，当前版本未被替换" });
		const jobPath = join(this.options.controlRoot, "jobs", `${current.jobId}.json`);
		const workerPid = await this.dependencies.spawnWorker(jobPath);
		return this.store.transition(current.jobId, "applying", { workerPid });
	}
	/** Reserve and start one detached continuous-adaptation operation. */
	async start() {
		const previous = await this.recover();
		if (previous !== void 0 && isActiveUpdatePhase(previous.phase)) throw new AdaptiveUpdateApiError(409, previous.phase === "applying" ? "持续适配正在恢复切换" : "持续适配正在进行中");
		const checkout = await this.dependencies.inspectCheckout(this.options.repositoryRoot);
		if (!checkout.clean) throw new AdaptiveUpdateApiError(409, "源码目录有未提交改动，无法安全适配");
		const jobId = this.dependencies.newJobId();
		const jobPath = join(this.options.controlRoot, "jobs", `${jobId}.json`);
		await writeJob(jobPath, {
			schemaVersion: 1,
			jobId,
			repositoryRoot: this.options.repositoryRoot,
			controlRoot: this.options.controlRoot,
			dshHome: this.options.dshHome,
			upstreamUrl: this.options.upstreamUrl,
			upstreamBranch: this.options.upstreamBranch,
			runtime: this.options.runtime
		});
		const workerPid = await this.dependencies.spawnWorker(jobPath);
		try {
			return await this.store.begin({
				jobId,
				currentCommit: checkout.commit,
				workerPid
			});
		} catch (error) {
			this.dependencies.stopWorker(workerPid);
			throw error;
		}
	}
};
//#endregion
//#region src/state.ts
/** Atomic durable state for the external adaptive-update worker. */
const STATE_FILE = "state.json";
const COMMIT = /^[a-f0-9]{40}$/u;
const PHASES = new Set([
	"discovering",
	"reviewing",
	"adapting",
	"validating",
	"waiting-for-idle",
	"applying",
	"completed",
	"failed",
	"rolled-back"
]);
function invalidState() {
	return /* @__PURE__ */ new Error("invalid continuous adaptation state");
}
function parseState(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) throw invalidState();
	const state = value;
	if (state.schemaVersion !== 1 || typeof state.phase !== "string" || !PHASES.has(state.phase) || typeof state.jobId !== "string" || state.jobId === "" || typeof state.workerPid !== "number" || !Number.isInteger(state.workerPid) || state.workerPid <= 0 || typeof state.currentCommit !== "string" || !COMMIT.test(state.currentCommit) || typeof state.startedAt !== "string" || Number.isNaN(Date.parse(state.startedAt)) || typeof state.updatedAt !== "string" || Number.isNaN(Date.parse(state.updatedAt)) || !Array.isArray(state.checks)) throw invalidState();
	return state;
}
function nextTimestamp(now, previous) {
	const candidate = now();
	if (Number.isNaN(Date.parse(candidate))) throw new Error("continuous adaptation clock returned an invalid timestamp");
	if (previous === void 0 || candidate > previous) return candidate;
	return new Date(Date.parse(previous) + 1).toISOString();
}
/** File-backed state store shared by the Host API and detached worker. */
var UpdateStateStore = class {
	controlRoot;
	now;
	path;
	/**
	* @param controlRoot - plugin-owned directory outside the user's DSH Home.
	* @param now - timestamp source used for deterministic tests.
	*/
	constructor(controlRoot, now = () => (/* @__PURE__ */ new Date()).toISOString()) {
		this.controlRoot = controlRoot;
		this.now = now;
		this.path = join(controlRoot, STATE_FILE);
	}
	/**
	* Read and validate the latest atomically persisted operation state.
	* @returns the last durable state, or undefined before the first run.
	*/
	async read() {
		const raw = await readFile(this.path, "utf8").catch((error) => {
			if (error.code === "ENOENT") return void 0;
			throw error;
		});
		if (raw === void 0) return void 0;
		try {
			return parseState(JSON.parse(raw));
		} catch (error) {
			if (error instanceof Error && error.message === "invalid continuous adaptation state") throw error;
			throw invalidState();
		}
	}
	/**
	* Reserve the single operation slot and publish the discovering phase.
	* @param input - immutable job identity and starting source commit.
	* @returns the durable starting state.
	*/
	async begin(input) {
		const previous = await this.read();
		if (previous !== void 0 && isActiveUpdatePhase(previous.phase)) throw new Error("a continuous adaptation is already running");
		if (input.jobId === "" || !COMMIT.test(input.currentCommit) || input.workerPid <= 0) throw new Error("invalid continuous adaptation job");
		const timestamp = nextTimestamp(this.now, previous?.updatedAt);
		return this.write({
			schemaVersion: 1,
			phase: "discovering",
			jobId: input.jobId,
			workerPid: input.workerPid,
			currentCommit: input.currentCommit,
			startedAt: timestamp,
			updatedAt: timestamp,
			checks: []
		});
	}
	/**
	* Publish one worker-owned phase transition.
	* @param jobId - operation that owns the current state.
	* @param phase - next durable phase.
	* @param patch - fields committed with the phase.
	* @returns the new durable state.
	*/
	async transition(jobId, phase, patch = {}) {
		const current = await this.read();
		if (current === void 0 || current.jobId !== jobId) throw new Error("continuous adaptation job does not own the current state");
		return this.write({
			...current,
			...patch,
			schemaVersion: 1,
			phase,
			jobId,
			updatedAt: nextTimestamp(this.now, current.updatedAt)
		});
	}
	async write(state) {
		await mkdir(this.controlRoot, {
			recursive: true,
			mode: 448
		});
		const temporary = join(this.controlRoot, `.state-${randomUUID()}.tmp`);
		try {
			await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, {
				encoding: "utf8",
				flag: "wx",
				mode: 384
			});
			await rename(temporary, this.path);
		} finally {
			await unlink(temporary).catch(() => void 0);
		}
		return state;
	}
};
//#endregion
//#region src/worker-runtime.ts
/**
* Create a stable unique job id used by the live Host engine.
* @returns a filesystem- and Git-ref-safe operation identifier.
*/
function newUpdateJobId() {
	return `${(/* @__PURE__ */ new Date()).toISOString().replace(/[^0-9]/gu, "").slice(0, 14)}-${randomUUID().slice(0, 8)}`;
}
//#endregion
//#region src/index.ts
/** Native Host half of the continuous-adaptation plugin. */
/** Native updater configuration schema. */
const Config = z.object({
	upstreamUrl: z.string().default("https://github.com/deepseek-ai/deepseek-harness.git"),
	upstreamBranch: z.string().default("master"),
	repositoryRoot: z.string(),
	automaticCheckIntervalMs: z.number().step(1).min(6e4).default(360 * 60 * 1e3)
});
/** Services required by the Host API and idle barrier. */
const inject = ["webServer", "agents"];
async function inspectCheckout(repositoryRoot) {
	const head = await runCommand("git", ["rev-parse", "HEAD"], {
		cwd: repositoryRoot,
		timeoutMs: 3e4
	});
	requireCommand("git rev-parse", head);
	const status = await runCommand("git", ["status", "--porcelain"], {
		cwd: repositoryRoot,
		timeoutMs: 3e4
	});
	requireCommand("git status", status);
	return {
		commit: head.stdout.trim(),
		clean: status.stdout.trim() === ""
	};
}
function workerEntry() {
	return fileURLToPath(import.meta.url).endsWith(".ts") ? {
		path: fileURLToPath(new URL("./worker-entry.ts", import.meta.url)),
		argsPrefix: ["--import", "tsx/esm"]
	} : {
		path: fileURLToPath(new URL("./worker-entry.js", import.meta.url)),
		argsPrefix: []
	};
}
/** Register the native API and detached-worker recovery for one web runtime. */
function apply(ctx, config) {
	const repositoryRoot = config.repositoryRoot ?? process.cwd();
	const dshHome = resolveDshHome();
	const controlRoot = `${dshHome}.adaptive-update`;
	const entry = workerEntry();
	const engine = new AdaptiveUpdateEngine({
		controlRoot,
		repositoryRoot,
		dshHome,
		upstreamUrl: config.upstreamUrl,
		upstreamBranch: config.upstreamBranch,
		runtime: {
			command: process.execPath,
			args: [...process.execArgv, ...process.argv.slice(1)],
			cwd: process.cwd(),
			baseUrl: `http://127.0.0.1:${ctx.webServer.port}`,
			currentPid: process.pid,
			stableCommand: {
				command: process.execPath,
				argsPrefix: [...process.execArgv, process.argv[1] ?? ""]
			}
		},
		isIdle: () => ctx.agents.roots().every((agent) => agent.status === "idle")
	}, new UpdateStateStore(controlRoot), {
		inspectCheckout,
		spawnWorker: async (jobPath) => {
			const logDirectory = `${controlRoot}/logs`;
			mkdirSync(logDirectory, {
				recursive: true,
				mode: 448
			});
			const log = openSync(`${logDirectory}/${jobPath.split("/").at(-1) ?? "worker"}.log`, "a", 384);
			const child = spawn(process.execPath, [
				...entry.argsPrefix,
				entry.path,
				jobPath
			], {
				cwd: repositoryRoot,
				env: sanitizedProcessEnv(),
				detached: true,
				stdio: [
					"ignore",
					log,
					log
				]
			});
			closeSync(log);
			child.unref();
			if (child.pid === void 0) throw new Error("无法启动持续适配后台工人");
			return child.pid;
		},
		stopWorker: (pid) => {
			try {
				process.kill(pid, "SIGTERM");
			} catch {}
		},
		isProcessAlive: (pid) => {
			try {
				process.kill(pid, 0);
				return true;
			} catch {
				return false;
			}
		},
		newJobId: newUpdateJobId
	});
	const automatic = new AutomaticUpdateMonitor(controlRoot, config.automaticCheckIntervalMs, engine, () => inspectOfficialUpdate(repositoryRoot, config.upstreamUrl, config.upstreamBranch));
	ctx.effect(() => ctx.webServer.register({
		kind: "prefix",
		path: ADAPTIVE_UPDATE_API_ROUTE,
		handler: (req, res) => {
			adaptiveUpdateApiHandler(req, res, engine, automatic);
		}
	}), "ui-adaptive-update: native continuous-adaptation API");
	ctx.effect(() => automatic.start(), "ui-adaptive-update: automatic official-repository monitor");
	engine.recover().catch((error) => ctx.logger.warn(error instanceof Error ? error : new Error(String(error))));
}
//#endregion
export { Config, apply, inject };
