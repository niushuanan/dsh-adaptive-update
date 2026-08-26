import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { chmod, lstat, mkdir, open, readFile, readdir, rename, rm, stat, symlink, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { setTimeout as setTimeout$1 } from "node:timers/promises";
//#region lib/types/process.js
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
//#region lib/types/agent-runner.js
/** Stable-version headless Agent runner for candidate compatibility and adaptation. */
const ADAPTIVE_AGENT_MODEL = "deepseek-v4-flash-vision-exp";
const MODEL_PATCH_FILE = "adaptive-agent-model.cordis.yml";
const MODEL_SETTINGS_FILE = "adaptive-agent-model.settings.yaml";
/** A stable Agent turn that exited without successful completion. */
var StableAgentRunError = class extends Error {
	/** Whether the bounded Agent command reached its configured deadline. */
	timedOut;
	/** Model-visible standard output captured for the compatibility report. */
	output;
	constructor(result) {
		const detail = result.stderr.trim() || result.stdout.trim() || "no output";
		super(`stable DSH Agent failed (exit=${String(result.exitCode)}, signal=${String(result.signal)}, timedOut=${String(result.timedOut)}): ${detail}`);
		this.name = "StableAgentRunError";
		this.timedOut = result.timedOut;
		this.output = result.stdout.trim();
	}
};
/**
* Resolve the source-mode TypeScript loader from the stable checkout so the
* Agent can run while its current directory is a dependency-free worktree.
* @param command - launch vector captured from the live stable product.
* @param repositoryRoot - stable checkout that owns the installed loader.
* @returns launch vector independent from the review or candidate directory.
*/
function pinStableCommand(command, repositoryRoot) {
	const requireFromStable = createRequire(join(repositoryRoot, "package.json"));
	return {
		...command,
		argsPrefix: command.argsPrefix.map((argument) => argument === "tsx/esm" ? requireFromStable.resolve(argument) : argument)
	};
}
async function dependencyDirectories(directory) {
	const found = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		if (entry.name === ".git") continue;
		const path = join(directory, entry.name);
		if (entry.isDirectory() && entry.name === "node_modules") found.push(path);
		else if (entry.isDirectory()) found.push(...await dependencyDirectories(path));
	}
	return found;
}
async function mountStableDependencies(stableRoot, targetRoot) {
	const mounted = [];
	try {
		for (const source of await dependencyDirectories(stableRoot)) {
			const target = join(targetRoot, relative(stableRoot, source));
			await mkdir(dirname(target), { recursive: true });
			if (await lstat(target).then(() => true).catch((error) => {
				if (error.code === "ENOENT") return false;
				throw error;
			})) continue;
			await symlink(source, target, "junction");
			mounted.push(target);
		}
		return mounted;
	} catch (error) {
		await Promise.all(mounted.map((path) => rm(path, { force: true })));
		throw error;
	}
}
async function writeModelOverlay(shadowHome) {
	const settingsPath = join(shadowHome, MODEL_SETTINGS_FILE);
	const patchPath = join(shadowHome, MODEL_PATCH_FILE);
	await writeFile(settingsPath, [
		"agent-default-model:",
		"  provider: deepseek-official",
		`  model: ${ADAPTIVE_AGENT_MODEL}`,
		""
	].join("\n"), {
		encoding: "utf8",
		mode: 384
	});
	await writeFile(patchPath, [
		"- id: settings",
		"  config:",
		`    path: ${JSON.stringify(settingsPath)}`,
		"    watch: false",
		""
	].join("\n"), {
		encoding: "utf8",
		mode: 384
	});
	await Promise.all([chmod(settingsPath, 384), chmod(patchPath, 384)]);
	return patchPath;
}
/**
* Run one fixed-model stable DSH headless task in an isolated working tree and Home.
* @param options - stable CLI, candidate directory, shadow Home, task, and optional process bound.
* @returns the final assistant text from stdout.
*/
async function runStableAgent(options) {
	const mounted = await mountStableDependencies(options.stableRoot, options.cwd);
	try {
		const modelPatch = await writeModelOverlay(options.shadowHome);
		const result = await runCommand(options.command, [
			...options.argsPrefix,
			"--profile",
			"headless",
			"--patch",
			modelPatch,
			options.task
		], {
			cwd: options.cwd,
			timeoutMs: options.timeoutMs,
			env: {
				...sanitizedProcessEnv(),
				DSH_HOME: options.shadowHome,
				DSH_TELEMETRY_DISABLED: "1"
			}
		});
		if (result.timedOut || result.signal !== null || result.exitCode !== 0) throw new StableAgentRunError(result);
		const output = result.stdout.trim();
		if (output === "") throw new Error("stable DSH Agent returned no review or adaptation result");
		return output;
	} finally {
		await Promise.all(mounted.map((path) => rm(path, { force: true })));
	}
}
//#endregion
//#region lib/types/cutover.js
/** Stop-snapshot-switch-restart transaction with automatic rollback. */
/**
* Apply a verified candidate only after the usable product is idle and stopped.
* @param options - pinned code, data, and process identity.
* @param dependencies - concrete external-worker operations.
* @returns completed or rolled-back only after real readiness.
*/
async function applyCandidate(options, dependencies) {
	if (!await dependencies.isCheckoutClean(options.repositoryRoot)) throw new Error("continuous adaptation requires a clean source checkout");
	await dependencies.waitForIdle();
	await dependencies.stopCurrent(options.currentPid);
	let snapshotPath;
	try {
		snapshotPath = await dependencies.createSnapshot(options.dshHome, options.controlRoot, options.jobId);
	} catch {
		await dependencies.spawnRuntime();
		if (!await dependencies.waitForReadiness()) throw new Error("continuous adaptation could not restart the unchanged product after snapshot failure");
		return {
			status: "rolled-back",
			snapshotPath: ""
		};
	}
	let candidatePid;
	let ready = false;
	try {
		await dependencies.advanceCheckout(options.repositoryRoot, options.candidateCommit);
		ready = await dependencies.waitForReadiness();
		if (!ready) {
			candidatePid = await dependencies.spawnRuntime();
			ready = await dependencies.waitForReadiness();
		}
	} catch {
		ready = false;
	}
	if (ready) return {
		status: "completed",
		snapshotPath
	};
	await dependencies.stopCandidate(candidatePid);
	await dependencies.advanceCheckout(options.repositoryRoot, options.currentCommit);
	await dependencies.restoreSnapshot(options.dshHome, snapshotPath, options.controlRoot, options.jobId);
	await dependencies.spawnRuntime();
	if (!await dependencies.waitForReadiness()) throw new Error("continuous adaptation rollback could not restore product readiness");
	return {
		status: "rolled-back",
		snapshotPath
	};
}
/**
* Resume an interrupted applying phase from its durable transaction facts.
* @param options - cutover inputs plus the snapshot published before checkout advance.
* @param dependencies - external-worker operations and current HEAD reader.
* @returns completed candidate or fully restored previous product.
*/
async function recoverInterruptedCutover(options, dependencies) {
	const head = await dependencies.currentHead(options.repositoryRoot);
	if (head !== options.currentCommit && head !== options.candidateCommit) throw new Error(`continuous adaptation cannot recover unexpected checkout ${head}`);
	if (head === options.candidateCommit && await dependencies.waitForReadiness()) {
		if (options.snapshotPath === void 0) throw new Error("continuous adaptation candidate is current but the data snapshot is not recorded");
		return {
			status: "completed",
			snapshotPath: options.snapshotPath
		};
	}
	await dependencies.stopCandidate(void 0);
	if (head !== options.currentCommit) await dependencies.advanceCheckout(options.repositoryRoot, options.currentCommit);
	if (options.snapshotPath !== void 0) await dependencies.restoreSnapshot(options.dshHome, options.snapshotPath, options.controlRoot, options.jobId);
	await dependencies.spawnRuntime();
	if (!await dependencies.waitForReadiness()) throw new Error("continuous adaptation interrupted rollback could not restore product readiness");
	return {
		status: "rolled-back",
		snapshotPath: options.snapshotPath ?? ""
	};
}
//#endregion
//#region lib/types/review.js
/** Pure repository-diff projection used by the compatibility report. */
const PACKAGE_PATH = /^(packages\/[^/]+\/[^/]+)\//u;
/**
* Project changed paths into fixed risk identifiers ordered by product impact.
* @param paths - repository-relative paths changed by either merge side.
* @returns unique risk identifiers in product-impact order.
*/
function riskAreasFor(paths) {
	const areas = [];
	const includes = (pattern) => paths.some((path) => pattern.test(path));
	if (includes(/^packages\/client\//u)) areas.push("client-plugins");
	if (includes(/^packages\/host\//u)) areas.push("host-api");
	if (includes(/(^|\/)(cordis\.patch\.yml|profile|bundle)(\/|$)/u)) areas.push("profile-composition");
	if (includes(/(^|\/)settings?(\/|\.|-)/u)) areas.push("settings");
	if (includes(/(^|\/)session(\/|-)|migration|resources\/sql/u)) areas.push("session-persistence");
	if (includes(/(^|\/)attachment(\/|-)/u)) areas.push("attachments");
	return areas;
}
/**
* Resolve package names for files changed on both sides of the merge base.
* @param repositoryRoot - current source checkout.
* @param paths - overlapping or directly conflicting file paths.
* @returns unique manifest names in lexical order.
*/
async function impactedPluginNames(repositoryRoot, paths) {
	const roots = [...new Set(paths.flatMap((path) => {
		const match = PACKAGE_PATH.exec(path);
		return match?.[1] === void 0 ? [] : [match[1]];
	}))].sort();
	const names = [];
	for (const root of roots) {
		const manifest = JSON.parse(await readFile(join(repositoryRoot, root, "package.json"), "utf8"));
		names.push(typeof manifest.name === "string" && manifest.name !== "" ? manifest.name : root);
	}
	return [...new Set(names)].sort();
}
//#endregion
//#region lib/types/repository.js
/** Exact-ref Git inspection and disposable review worktree lifecycle. */
const JOB_ID$1 = /^[a-z0-9][a-z0-9-]{0,79}$/u;
async function git$1(repositoryRoot, args, timeoutMs = 12e4) {
	const result = await runCommand("git", args, {
		cwd: repositoryRoot,
		timeoutMs
	});
	requireCommand(`git ${args[0] ?? ""}`, result);
	return result.stdout.trim();
}
function lines(value) {
	return value === "" ? [] : value.split("\n").map((line) => line.trim()).filter(Boolean).sort();
}
async function refreshCleanWorktree(worktreePath) {
	requireCommand("git disposable worktree content check", await runCommand("git", [
		"diff",
		"--quiet",
		"--"
	], {
		cwd: worktreePath,
		timeoutMs: 12e4
	}));
	let indexCheck;
	for (let attempt = 0; attempt < 20; attempt += 1) {
		await git$1(worktreePath, ["update-index", "--really-refresh"]);
		indexCheck = await runCommand("git", [
			"diff-index",
			"--quiet",
			"HEAD",
			"--"
		], {
			cwd: worktreePath,
			timeoutMs: 12e4
		});
		if (indexCheck.exitCode === 0) break;
		await setTimeout$1(1e3);
	}
	if (indexCheck === void 0) throw new Error("continuous adaptation could not inspect disposable worktree");
	requireCommand("git disposable worktree index check", indexCheck);
	if (await git$1(worktreePath, ["status", "--porcelain"]) !== "") throw new Error("continuous adaptation disposable worktree was not created cleanly");
}
async function requireMergeStarted(label, cwd, result) {
	if (result.timedOut || result.signal !== null || result.exitCode !== 0 && result.exitCode !== 1) requireCommand(label, result);
	if (result.exitCode === 1) {
		if ((await runCommand("git", [
			"rev-parse",
			"-q",
			"--verify",
			"MERGE_HEAD"
		], {
			cwd,
			timeoutMs: 3e4
		})).exitCode !== 0) requireCommand(label, result);
	}
}
async function cleanupRegisteredWorktree(repositoryRoot, path, branch) {
	await git$1(repositoryRoot, [
		"worktree",
		"remove",
		"--force",
		path
	], 3e5);
	if (branch !== void 0) await git$1(repositoryRoot, [
		"branch",
		"-D",
		branch
	]);
	await git$1(repositoryRoot, ["worktree", "prune"]);
}
/**
* Create the adaptation worktree and repeat the exact pinned trial merge.
* @param options - repository, control root, and job identity.
* @param currentCommit - local product commit containing the updater.
* @param upstreamCommit - exact official commit already reviewed.
* @returns candidate worktree path.
*/
async function createCandidateWorktree(options, currentCommit, upstreamCommit) {
	if (!JOB_ID$1.test(options.jobId)) throw new Error("invalid continuous adaptation job id");
	const candidatePath = join(options.controlRoot, "candidates", options.jobId);
	await mkdir(join(options.controlRoot, "candidates"), {
		recursive: true,
		mode: 448
	});
	await git$1(options.repositoryRoot, [
		"worktree",
		"add",
		"-b",
		`adaptive-update/${options.jobId}`,
		candidatePath,
		currentCommit
	], 3e5);
	const branch = `adaptive-update/${options.jobId}`;
	try {
		await refreshCleanWorktree(candidatePath);
		await requireMergeStarted("git candidate merge", candidatePath, await runCommand("git", [
			"-c",
			"core.hooksPath=/dev/null",
			"merge",
			"--no-autostash",
			"--no-verify",
			"--no-commit",
			"--no-ff",
			upstreamCommit
		], {
			cwd: candidatePath,
			timeoutMs: 3e5
		}));
		return candidatePath;
	} catch (error) {
		await cleanupRegisteredWorktree(options.repositoryRoot, candidatePath, branch);
		throw error;
	}
}
/**
* Require the stable Agent to leave a resolved, uncommitted candidate merge.
* @param candidatePath - adaptation worktree.
* @param currentCommit - original local product commit.
*/
async function assertCandidateResolved(candidatePath, currentCommit) {
	if (await git$1(candidatePath, ["rev-parse", "HEAD"]) !== currentCommit) throw new Error("continuous adaptation Agent committed or moved the candidate branch");
	const unresolved = lines(await git$1(candidatePath, [
		"diff",
		"--name-only",
		"--diff-filter=U"
	]));
	if (unresolved.length > 0) throw new Error(`continuous adaptation candidate still has unresolved files: ${unresolved.join(", ")}`);
	requireCommand("git candidate diff check", await runCommand("git", ["diff", "--check"], {
		cwd: candidatePath,
		timeoutMs: 12e4
	}));
}
/**
* Pin upstream, compute two-sided changes, and leave a disposable trial merge
* for exact conflict discovery.
* @param options - exact repository, control root, job, and upstream source.
* @returns pinned commits, review worktree, and deterministic report.
*/
async function createRepositoryReview(options) {
	if (!JOB_ID$1.test(options.jobId)) throw new Error("invalid continuous adaptation job id");
	const currentCommit = await git$1(options.repositoryRoot, ["rev-parse", "HEAD"]);
	if (await git$1(options.repositoryRoot, ["status", "--porcelain"]) !== "") throw new Error("continuous adaptation requires a clean source checkout");
	const upstreamRef = `refs/dsh-adaptive-update/${options.jobId}/upstream`;
	await git$1(options.repositoryRoot, [
		"fetch",
		"--force",
		"--no-tags",
		options.upstreamUrl,
		`refs/heads/${options.upstreamBranch}:${upstreamRef}`
	], 3e5);
	const upstreamCommit = await git$1(options.repositoryRoot, ["rev-parse", upstreamRef]);
	const mergeBase = await git$1(options.repositoryRoot, [
		"merge-base",
		currentCommit,
		upstreamCommit
	]);
	const localFiles = lines(await git$1(options.repositoryRoot, [
		"diff",
		"--name-only",
		`${mergeBase}..${currentCommit}`
	]));
	const upstreamFiles = lines(await git$1(options.repositoryRoot, [
		"diff",
		"--name-only",
		`${mergeBase}..${upstreamCommit}`
	]));
	const upstreamSet = new Set(upstreamFiles);
	const overlappingFiles = localFiles.filter((path) => upstreamSet.has(path));
	const reviewPath = join(options.controlRoot, "reviews", options.jobId);
	await mkdir(join(options.controlRoot, "reviews"), {
		recursive: true,
		mode: 448
	});
	await git$1(options.repositoryRoot, [
		"worktree",
		"add",
		"--detach",
		reviewPath,
		currentCommit
	], 3e5);
	try {
		await refreshCleanWorktree(reviewPath);
		await requireMergeStarted("git trial merge", reviewPath, await runCommand("git", [
			"-c",
			"core.hooksPath=/dev/null",
			"merge",
			"--no-autostash",
			"--no-verify",
			"--no-commit",
			"--no-ff",
			upstreamCommit
		], {
			cwd: reviewPath,
			timeoutMs: 3e5
		}));
		const conflictFiles = lines(await git$1(reviewPath, [
			"diff",
			"--name-only",
			"--diff-filter=U"
		]));
		const impactedPlugins = await impactedPluginNames(options.repositoryRoot, conflictFiles.length === 0 ? overlappingFiles : conflictFiles);
		const riskAreas = riskAreasFor([...localFiles, ...upstreamFiles]);
		return {
			reviewPath,
			currentCommit,
			upstreamCommit,
			upstreamRef,
			report: {
				mergeBase,
				localChangedFiles: localFiles.length,
				upstreamChangedFiles: upstreamFiles.length,
				overlappingFiles,
				conflictFiles,
				impactedPlugins,
				riskAreas
			}
		};
	} catch (error) {
		await cleanupRegisteredWorktree(options.repositoryRoot, reviewPath);
		throw error;
	}
}
/**
* Remove one registered review worktree without following paths inside it.
* @param repositoryRoot - source checkout owning the worktree registry.
* @param reviewPath - exact registered review path.
*/
async function removeReviewWorktree(repositoryRoot, reviewPath) {
	await git$1(repositoryRoot, [
		"worktree",
		"remove",
		"--force",
		reviewPath
	], 3e5);
	await git$1(repositoryRoot, ["worktree", "prune"]);
}
/**
* Remove a registered candidate worktree and its temporary branch.
* @param repositoryRoot - source checkout owning the worktree registry.
* @param candidatePath - exact registered candidate worktree path.
* @param jobId - operation identity used by the temporary branch.
*/
async function removeCandidateWorktree(repositoryRoot, candidatePath, jobId) {
	await git$1(repositoryRoot, [
		"worktree",
		"remove",
		"--force",
		candidatePath
	], 3e5);
	await git$1(repositoryRoot, [
		"branch",
		"-D",
		`adaptive-update/${jobId}`
	]);
	await git$1(repositoryRoot, ["worktree", "prune"]);
}
//#endregion
//#region lib/types/retention.js
/** Bounded cleanup for adaptive-update-owned transient artifacts. */
const TRANSIENT_DIRECTORIES = [
	"reviews",
	"candidates",
	"shadow-homes"
];
async function removeEntry(path) {
	if ((await lstat(path)).isSymbolicLink()) {
		await unlink(path);
		return;
	}
	await rm(path, {
		recursive: true,
		force: true
	});
}
async function removeChildren(directory, keep) {
	await mkdir(directory, {
		recursive: true,
		mode: 448
	});
	const removed = (await readdir(directory)).filter((name) => name !== keep);
	for (const name of removed) await removeEntry(join(directory, name));
	return removed.length;
}
/**
* Remove completed transient artifacts and all but one previous-data snapshot.
* @param controlRoot - fixed plugin-owned control directory.
* @param options - complete snapshot path retained for rollback.
* @returns removal counts for the update report.
*/
async function pruneOwnedArtifacts(controlRoot, options = {}) {
	let removedTransient = 0;
	for (const name of TRANSIENT_DIRECTORIES) removedTransient += await removeChildren(join(controlRoot, name));
	removedTransient += await removeChildren(join(controlRoot, "logs"));
	const snapshots = resolve(controlRoot, "snapshots");
	let keepSnapshot;
	if (options.keepSnapshot !== void 0) {
		const kept = resolve(options.keepSnapshot);
		if (dirname(kept) !== snapshots) throw new Error("continuous adaptation retained snapshot is outside the owned directory");
		keepSnapshot = basename(kept);
	}
	const removedSnapshots = await removeChildren(snapshots, keepSnapshot);
	return {
		removedTransient,
		removedSnapshots
	};
}
//#endregion
//#region lib/types/shadow-home.js
/** Minimal private DSH Home for stable review and adaptation Agents. */
const SHADOW_FILES = [
	".env",
	".credentials.yaml",
	"settings.yaml",
	"AGENTS.md",
	"SYSTEM.md"
];
async function copyPrivateFile(source, destination) {
	const info = await stat(source).catch((error) => {
		if (error.code === "ENOENT") return void 0;
		throw error;
	});
	if (info === void 0) return;
	if (!info.isFile()) throw new Error(`continuous adaptation private input is not a file: ${source}`);
	const content = await readFile(source);
	const handle = await open(destination, "wx", 384);
	try {
		await handle.writeFile(content);
	} finally {
		await handle.close();
	}
}
/**
* Copy only the configuration required by a stable headless Agent.
* @param realHome - user's real DSH Home.
* @param controlRoot - plugin-owned sibling control directory.
* @param jobId - active operation id.
* @returns the isolated shadow Home path.
*/
async function createShadowHome(realHome, controlRoot, jobId) {
	const shadow = join(controlRoot, "shadow-homes", jobId);
	await mkdir(shadow, {
		recursive: true,
		mode: 448
	});
	for (const name of SHADOW_FILES) await copyPrivateFile(join(realHome, name), join(shadow, name));
	return shadow;
}
//#endregion
//#region lib/types/snapshot.js
/** Copy-on-write whole-Home snapshot used only during the short cutover. */
function requireSiblingRoots(dshHome, controlRoot) {
	if (dirname(dshHome) !== dirname(controlRoot)) throw new Error("continuous adaptation control directory must be a sibling of DSH Home");
}
/**
* Create one filesystem copy-on-write snapshot after the current DSH stops.
* @param dshHome - real user data directory.
* @param controlRoot - plugin-owned sibling directory.
* @param jobId - operation id used as the snapshot directory name.
* @returns complete snapshot path.
*/
async function createDataSnapshot(dshHome, controlRoot, jobId) {
	requireSiblingRoots(dshHome, controlRoot);
	const info = await lstat(dshHome);
	if (!info.isDirectory() || info.isSymbolicLink()) throw new Error("DSH Home must be a real directory for an atomic data snapshot");
	const snapshots = join(controlRoot, "snapshots");
	const snapshot = join(snapshots, jobId);
	await mkdir(snapshots, {
		recursive: true,
		mode: 448
	});
	await rm(snapshot, {
		recursive: true,
		force: true
	});
	const command = process.platform === "darwin" ? "/bin/cp" : "cp";
	const args = process.platform === "darwin" ? [
		"-cR",
		dshHome,
		snapshot
	] : [
		"--reflink=always",
		"-a",
		dshHome,
		snapshot
	];
	if (process.platform === "win32") throw new Error("copy-on-write DSH snapshots are not available on Windows");
	requireCommand("copy-on-write DSH data snapshot", await runCommand(command, args, {
		cwd: dirname(dshHome),
		timeoutMs: 3e5
	}));
	return snapshot;
}
/**
* Atomically replace candidate-mutated data with its pre-cutover snapshot.
* @param dshHome - real user data directory.
* @param snapshotPath - snapshot created for this job.
* @param controlRoot - plugin-owned sibling directory.
* @param jobId - operation id used for failed-data quarantine.
*/
async function restoreDataSnapshot(dshHome, snapshotPath, controlRoot, jobId) {
	requireSiblingRoots(dshHome, controlRoot);
	if (snapshotPath !== join(controlRoot, "snapshots", jobId)) throw new Error("continuous adaptation snapshot does not belong to this job");
	const info = await lstat(snapshotPath);
	if (!info.isDirectory() || info.isSymbolicLink()) throw new Error("continuous adaptation snapshot is not a real directory");
	const failedRoot = join(controlRoot, "failed-data");
	const failed = join(failedRoot, jobId);
	await mkdir(failedRoot, {
		recursive: true,
		mode: 448
	});
	await rm(failed, {
		recursive: true,
		force: true
	});
	await rename(dshHome, failed);
	try {
		await rename(snapshotPath, dshHome);
	} catch (error) {
		await rename(failed, dshHome);
		throw error;
	}
	await rm(failed, {
		recursive: true,
		force: true
	});
}
//#endregion
//#region lib/types/types.js
/**
* Determine whether a phase still owns the single operation slot.
* @param phase - persisted update lifecycle phase.
* @returns true while the detached operation remains active.
*/
function isActiveUpdatePhase(phase) {
	return phase !== "completed" && phase !== "failed" && phase !== "rolled-back";
}
//#endregion
//#region lib/types/state.js
/** Atomic durable state for the external adaptive-update worker. */
const STATE_FILE = "state.json";
const COMMIT$1 = /^[a-f0-9]{40}$/u;
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
	if (state.schemaVersion !== 1 || typeof state.phase !== "string" || !PHASES.has(state.phase) || typeof state.jobId !== "string" || state.jobId === "" || typeof state.workerPid !== "number" || !Number.isInteger(state.workerPid) || state.workerPid <= 0 || typeof state.currentCommit !== "string" || !COMMIT$1.test(state.currentCommit) || typeof state.startedAt !== "string" || Number.isNaN(Date.parse(state.startedAt)) || typeof state.updatedAt !== "string" || Number.isNaN(Date.parse(state.updatedAt)) || !Array.isArray(state.checks)) throw invalidState();
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
		if (input.jobId === "" || !COMMIT$1.test(input.currentCommit) || input.workerPid <= 0) throw new Error("invalid continuous adaptation job");
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
//#region lib/types/validation.js
/** Minimal candidate checks required before source or data cutover. */
const CHECKS = [{
	id: "install",
	label: "准备新版依赖",
	status: "pending"
}, {
	id: "build",
	label: "确认新版可构建",
	status: "pending"
}];
var CandidateCheckError = class extends Error {
	checkId;
	constructor(checkId, message) {
		super(message);
		this.checkId = checkId;
	}
};
/**
* Require merge resolution, dependency preparation, and one production build.
* @param candidatePath - isolated candidate worktree.
* @param dependencies - concrete minimal build operations.
* @returns the complete passing check list.
*/
async function validateCandidate(candidatePath, dependencies) {
	const unresolved = await dependencies.unresolvedFiles(candidatePath);
	if (unresolved.length > 0) throw new Error(`candidate has unresolved files: ${unresolved.join(", ")}`);
	const completed = [];
	for (const check of CHECKS) {
		await dependencies.publishChecks([...completed, {
			...check,
			status: "running"
		}]);
		const result = await dependencies.runCheck(check, candidatePath);
		completed.push(result);
		await dependencies.publishChecks(completed);
		if (result.status !== "passed") throw new CandidateCheckError(check.id, result.detail ?? `${result.label} failed`);
	}
	return completed;
}
/**
* Re-open candidate adaptation when a real validation gate finds a problem.
* One build failure may return to a narrowly scoped compatibility repair.
* @param candidatePath - isolated candidate worktree.
* @param dependencies - concrete validation operations.
* @param repair - stable Agent repair callback receiving failure evidence.
* @param maxRepairs - bounded repair attempts before the update safely fails.
* @returns the complete passing check list.
*/
async function validateCandidateWithRepairs(candidatePath, dependencies, repair, maxRepairs = 2) {
	for (let attempt = 0;; attempt += 1) try {
		return await validateCandidate(candidatePath, dependencies);
	} catch (error) {
		if (!(error instanceof CandidateCheckError) || error.checkId !== "build" || attempt >= maxRepairs) throw error;
		await repair(error instanceof Error ? error.message : String(error), attempt + 1);
	}
}
//#endregion
//#region lib/types/worker.js
/** Conflict-focused preparation shared by the detached worker and unit tests. */
/** Completion marker required from every candidate adaptation task. */
const ADAPTATION_COMPLETE = "[DSH_ADAPTATION_COMPLETE]";
const CLEAN_COMPATIBILITY_TIMEOUT_MS = 5 * 6e4;
function adaptationTask(report) {
	if (report.conflictFiles.length === 0) return {
		timeoutMs: CLEAN_COMPATIBILITY_TIMEOUT_MS,
		task: [
			"你正在“持续适配”的独立候选工作树中，锁定的官方提交已完成 Git 无冲突合并。",
			"只检查上游改动与下面本地插件重叠文件及其直接契约；范围必须极窄，兼容则不修改任何文件。",
			"只有发现与这些重叠或直接契约有关的明确兼容问题时，才做最小修复。",
			"不做广泛 review 或全仓审查，不要运行测试、回放、构建或依赖安装，不修改文档、不重构。",
			"不要 git commit，不要修改真实 DSH_HOME，不要启动或停止当前产品，不要启动子代理或后台任务。",
			`极窄兼容清单：${JSON.stringify({
				overlappingFiles: report.overlappingFiles,
				directlyImpactedPlugins: report.impactedPlugins
			})}`,
			`在约 5 分钟内完成检查或最小修复，简要说明结果；最后一行必须且只能是 ${ADAPTATION_COMPLETE}。`
		].join("\n\n")
	};
	return {
		timeoutMs: null,
		task: [
			"你正在“持续适配”的独立候选工作树中，本地产品已与锁定的官方提交执行 --no-commit 合并。",
			"本次不设超时，但必须严格只处理下面的实际冲突文件及其直接编译依赖，不做全仓审查、不重构、不扩大范围。",
			"优先保留官方最新原生能力，同时保留冲突处涉及的本地产品行为和用户数据合同。",
			"“持续适配”必须保留独立候选区、空闲切换、数据快照和失败回滚。",
			"不要运行测试、回放、构建或依赖安装；外部工人只会执行一次依赖准备和一次生产构建。",
			"不要 git commit，不要修改真实 DSH_HOME，不要启动或停止当前产品，不要启动子代理或后台任务。",
			`窄范围合并清单：${JSON.stringify({
				conflictFiles: report.conflictFiles,
				directlyImpactedPlugins: report.impactedPlugins
			})}`,
			`解决全部冲突后简要说明改动，最后一行必须且只能是 ${ADAPTATION_COMPLETE}。`
		].join("\n\n")
	};
}
/**
* Inspect a disposable trial merge, then run a scope-matched Agent in a second worktree.
* @param options - immutable job inputs.
* @param dependencies - real or scripted operation edges.
* @returns the resolved candidate and deterministic conflict inventory.
*/
async function prepareUpdateCandidate(options, dependencies) {
	const review = await dependencies.createReview(options);
	const report = review.report;
	await dependencies.publish("reviewing", {
		upstreamCommit: review.upstreamCommit,
		report
	});
	await dependencies.removeReview(options.repositoryRoot, review.reviewPath);
	const candidatePath = await dependencies.createCandidate(options, review.currentCommit, review.upstreamCommit);
	await dependencies.publish("adapting", { report });
	const adaptation = adaptationTask(report);
	await dependencies.runAgent({
		cwd: candidatePath,
		shadowHome: options.shadowHome,
		stableCommand: options.stableCommand,
		...adaptation
	});
	await dependencies.assertCandidateResolved(candidatePath, review.currentCommit);
	return {
		candidatePath,
		currentCommit: review.currentCommit,
		upstreamCommit: review.upstreamCommit,
		report
	};
}
//#endregion
//#region lib/types/worker-runtime.js
/** Concrete detached-worker operations for one conflict-focused continuous adaptation. */
const COMMIT = /^[a-f0-9]{40}$/u;
const JOB_ID = /^[a-z0-9][a-z0-9-]{0,79}$/u;
function isStringArray(value) {
	return Array.isArray(value) && value.every((item) => typeof item === "string");
}
/**
* Accept only an Agent result that explicitly declares its atomic task complete.
* @param output - stable Agent final stdout.
* @returns final report text without the transport marker.
*/
function completedAgentOutput(output) {
	const marker = ADAPTATION_COMPLETE;
	const final = output.trim();
	if (!final.endsWith(marker)) throw new Error("stable DSH Agent returned an incomplete adaptation result");
	return final.slice(0, -25).trim();
}
/**
* Run one scope-matched compatibility turn and require an atomic completion marker.
* @param originalTask - complete task repeated for every continuation turn.
* @param runTurn - one stable Agent invocation carrying its caller-selected timeout policy.
* @returns the completed report without its transport marker.
*/
async function completeAgentTurns(originalTask, runTurn) {
	return completedAgentOutput(await runTurn(originalTask));
}
/**
* Parse the secret-free immutable job written by the live Host plugin.
* @param value - untrusted JSON value read from the job file.
* @returns a validated detached-worker job.
*/
function parseUpdateJob(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("invalid continuous adaptation job");
	const job = value;
	const runtime = job.runtime;
	const stable = runtime?.stableCommand;
	if (job.schemaVersion !== 1 || typeof job.jobId !== "string" || !JOB_ID.test(job.jobId) || typeof job.repositoryRoot !== "string" || !isAbsolute(job.repositoryRoot) || typeof job.controlRoot !== "string" || !isAbsolute(job.controlRoot) || typeof job.dshHome !== "string" || !isAbsolute(job.dshHome) || typeof job.upstreamUrl !== "string" || job.upstreamUrl === "" || typeof job.upstreamBranch !== "string" || job.upstreamBranch === "" || runtime === void 0 || typeof runtime.command !== "string" || runtime.command === "" || !isStringArray(runtime.args) || typeof runtime.cwd !== "string" || runtime.cwd === "" || typeof runtime.baseUrl !== "string" || !runtime.baseUrl.startsWith("http://127.0.0.1:") || !Number.isInteger(runtime.currentPid) || runtime.currentPid <= 0 || stable === void 0 || typeof stable.command !== "string" || stable.command === "" || !isStringArray(stable.argsPrefix)) throw new Error("invalid continuous adaptation job");
	return job;
}
/**
* Replay absolute source paths under another worktree.
* @param args - original process argument vector.
* @param repositoryRoot - source checkout used by the running product.
* @param targetRoot - review or candidate checkout used by the replayed process.
* @returns the replay-safe argument vector for the target checkout.
*/
function repositoryRuntimeArgs(args, repositoryRoot, targetRoot) {
	return args.map((argument) => {
		if (!isAbsolute(argument)) return argument;
		const local = relative(repositoryRoot, argument);
		if (local === ".." || local.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)) return argument;
		return resolve(targetRoot, local);
	});
}
async function git(cwd, args, timeoutMs = 3e5) {
	const result = await runCommand("git", args, {
		cwd,
		timeoutMs
	});
	requireCommand(`git ${args[0] ?? ""}`, result);
	return result.stdout.trim();
}
async function waitForState(store, jobId) {
	const deadline = Date.now() + 1e4;
	while (Date.now() < deadline) {
		const state = await store.read();
		if (state?.jobId === jobId) return state;
		await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
	}
	throw new Error("continuous adaptation worker could not acquire its durable state");
}
function validationRepairPrompt(report, failure, attempt) {
	return [
		`你正在“持续适配”候选区进行第 ${attempt} 次可构建性修复。`,
		"只根据下面的生产构建错误修改直接相关文件，不做全仓审查、不重构、不刷新快照。",
		"不要运行测试、回放、构建或依赖安装；不要 git commit、修改真实 DSH_HOME、启动或停止当前产品。",
		"不要启动子代理、并行开发或后台任务。",
		`构建失败证据：\n${failure}`,
		`原始冲突文件：${JSON.stringify(report.conflictFiles)}`,
		`完成直接修复后简要说明改动；最后一行必须且只能是 ${ADAPTATION_COMPLETE}。`
	].join("\n\n");
}
async function probeWeb(baseUrl) {
	try {
		const response = await fetch(baseUrl, { signal: AbortSignal.timeout(3e3) });
		if (!response.ok) return {
			hostReady: false,
			clientReady: false,
			detail: `HTTP ${response.status}`
		};
		const html = await response.text();
		const source = /<script[^>]+src=["']([^"']+\.js(?:\?[^"']*)?)["']/iu.exec(html)?.[1];
		if (source === void 0) return {
			hostReady: true,
			clientReady: false,
			detail: "首页未包含 Client 脚本"
		};
		const asset = await fetch(new URL(source, baseUrl), { signal: AbortSignal.timeout(3e3) });
		return {
			hostReady: true,
			clientReady: asset.ok,
			detail: asset.ok ? "Host 与 Client 均已就绪" : `Client 资源 HTTP ${asset.status}`
		};
	} catch (error) {
		return {
			hostReady: false,
			clientReady: false,
			detail: error instanceof Error ? error.message : String(error)
		};
	}
}
async function waitForWeb(baseUrl, timeoutMs) {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		const result = await probeWeb(baseUrl);
		if (result.hostReady && result.clientReady) return true;
		await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
	}
	return false;
}
function startRuntime(job, cwd, dshHome) {
	const args = repositoryRuntimeArgs(job.runtime.args, job.repositoryRoot, cwd);
	const child = spawn(job.runtime.command, args, {
		cwd,
		env: {
			...sanitizedProcessEnv(),
			DSH_HOME: dshHome,
			DSH_TELEMETRY_DISABLED: "1"
		},
		detached: true,
		stdio: "ignore"
	});
	child.unref();
	if (child.pid === void 0) throw new Error("continuous adaptation could not start DSH runtime");
	return child.pid;
}
async function stopPid(pid) {
	try {
		process.kill(pid, "SIGTERM");
	} catch (error) {
		if (error.code === "ESRCH") return;
		throw error;
	}
	const deadline = Date.now() + 2e4;
	while (Date.now() < deadline) {
		try {
			process.kill(pid, 0);
		} catch (error) {
			if (error.code === "ESRCH") return;
			throw error;
		}
		await new Promise((resolveDelay) => setTimeout(resolveDelay, 200));
	}
	process.kill(pid, "SIGKILL");
}
async function listenerPids(baseUrl, cwd) {
	const port = new URL(baseUrl).port;
	const result = await runCommand("lsof", ["-tiTCP:" + port, "-sTCP:LISTEN"], {
		cwd,
		timeoutMs: 1e4
	});
	if (result.exitCode === 1 && result.stdout.trim() === "") return [];
	requireCommand("lsof listener", result);
	return result.stdout.split("\n").map(Number).filter((pid) => Number.isInteger(pid) && pid > 0);
}
async function idleAt(baseUrl) {
	try {
		const response = await fetch(`${baseUrl}/plugins/ui-adaptive-update/api/idle`, { signal: AbortSignal.timeout(3e3) });
		if (!response.ok) return false;
		return (await response.json()).idle === true;
	} catch {
		return false;
	}
}
async function commitCandidate(candidatePath, upstreamCommit) {
	await git(candidatePath, ["add", "-A"]);
	await git(candidatePath, [
		"-c",
		"user.name=Xiaozhuang Continuous Adaptation",
		"-c",
		"user.email=adaptive-update@localhost",
		"-c",
		"core.hooksPath=/dev/null",
		"commit",
		"--no-verify",
		"-m",
		`chore(update): adapt to official ${upstreamCommit.slice(0, 12)}`
	]);
	const commit = await git(candidatePath, ["rev-parse", "HEAD"]);
	if (!COMMIT.test(commit)) throw new Error("continuous adaptation produced an invalid candidate commit");
	return commit;
}
async function runCheck(check, candidatePath) {
	const command = {
		install: {
			command: "pnpm",
			args: [
				"install",
				"--frozen-lockfile",
				"--prefer-offline"
			],
			timeoutMs: 6e5
		},
		build: {
			command: "pnpm",
			args: ["run", "build"],
			timeoutMs: 12e5
		}
	}[check.id];
	if (command === void 0) return {
		...check,
		status: "failed",
		detail: "未知验证项"
	};
	const result = await runCommand(command.command, command.args, {
		cwd: candidatePath,
		timeoutMs: command.timeoutMs
	});
	const detail = (result.stderr.trim() || result.stdout.trim()).slice(-4e3);
	const passed = !result.timedOut && result.signal === null && result.exitCode === 0;
	return {
		...check,
		status: passed ? "passed" : "failed",
		detail: detail || (passed ? "通过" : "命令失败")
	};
}
function cutoverDependencies(job) {
	return {
		isCheckoutClean: async (repositoryRoot) => await git(repositoryRoot, ["status", "--porcelain"]) === "",
		waitForIdle: async () => {
			const deadline = Date.now() + 30 * 6e4;
			while (Date.now() < deadline) {
				if (await idleAt(job.runtime.baseUrl)) return;
				await new Promise((resolveDelay) => setTimeout(resolveDelay, 1e3));
			}
			throw new Error("等待当前对话空闲超时");
		},
		stopCurrent: stopPid,
		createSnapshot: createDataSnapshot,
		advanceCheckout: async (repositoryRoot, commit) => {
			await git(repositoryRoot, [
				"reset",
				"--hard",
				commit
			]);
		},
		waitForReadiness: async () => waitForWeb(job.runtime.baseUrl, 15e3),
		spawnRuntime: async () => startRuntime(job, job.repositoryRoot, job.dshHome),
		stopCandidate: async (pid) => {
			if (pid !== void 0) await stopPid(pid).catch(() => void 0);
			for (const listener of await listenerPids(job.runtime.baseUrl, job.repositoryRoot)) if (listener !== process.pid) await stopPid(listener).catch(() => void 0);
		},
		restoreSnapshot: restoreDataSnapshot
	};
}
/**
* Execute one immutable detached-worker job to a ready candidate or rollback.
* @param job - validated immutable update request created by the live Host.
*/
async function runUpdateJob(job) {
	const store = new UpdateStateStore(job.controlRoot);
	const initial = await waitForState(store, job.jobId);
	const shadowHome = await createShadowHome(job.dshHome, job.controlRoot, job.jobId);
	let candidatePath;
	try {
		if (initial.phase === "applying") {
			if (initial.previousCommit === void 0 || initial.candidateCommit === void 0) throw new Error("continuous adaptation applying state lacks pinned commits");
			const dependencies = {
				...cutoverDependencies(job),
				currentHead: async (repositoryRoot) => git(repositoryRoot, ["rev-parse", "HEAD"])
			};
			const recovered = await recoverInterruptedCutover({
				repositoryRoot: job.repositoryRoot,
				dshHome: job.dshHome,
				controlRoot: job.controlRoot,
				jobId: job.jobId,
				currentCommit: initial.previousCommit,
				candidateCommit: initial.candidateCommit,
				currentPid: job.runtime.currentPid,
				...initial.snapshotPath === void 0 ? {} : { snapshotPath: initial.snapshotPath }
			}, dependencies);
			await store.transition(job.jobId, recovered.status, { snapshotPath: recovered.snapshotPath });
			return;
		}
		const stableCommand = pinStableCommand(job.runtime.stableCommand, job.repositoryRoot);
		const prepared = await prepareUpdateCandidate({
			repositoryRoot: job.repositoryRoot,
			controlRoot: job.controlRoot,
			realHome: job.dshHome,
			shadowHome,
			jobId: job.jobId,
			upstreamUrl: job.upstreamUrl,
			upstreamBranch: job.upstreamBranch,
			stableCommand
		}, {
			createReview: createRepositoryReview,
			removeReview: removeReviewWorktree,
			createCandidate: createCandidateWorktree,
			runAgent: async ({ cwd, shadowHome: home, stableCommand, task: originalTask, timeoutMs }) => {
				return completeAgentTurns(originalTask, (task) => runStableAgent({
					...stableCommand,
					cwd,
					stableRoot: job.repositoryRoot,
					shadowHome: home,
					task,
					timeoutMs
				}));
			},
			assertCandidateResolved,
			publish: async (phase, patch = {}) => {
				await store.transition(job.jobId, phase, patch);
			}
		});
		candidatePath = prepared.candidatePath;
		const preparedCandidatePath = prepared.candidatePath;
		await store.transition(job.jobId, "validating", {
			report: prepared.report,
			checks: []
		});
		const checks = await validateCandidateWithRepairs(preparedCandidatePath, {
			unresolvedFiles: async (path) => {
				const files = await git(path, [
					"diff",
					"--name-only",
					"--diff-filter=U"
				]);
				return files === "" ? [] : files.split("\n").filter(Boolean);
			},
			runCheck,
			publishChecks: async (checksPatch) => {
				await store.transition(job.jobId, "validating", { checks: checksPatch });
			}
		}, async (failure, attempt) => {
			await store.transition(job.jobId, "adapting");
			await completeAgentTurns(validationRepairPrompt(prepared.report, failure, attempt), (task) => runStableAgent({
				...stableCommand,
				cwd: preparedCandidatePath,
				stableRoot: job.repositoryRoot,
				shadowHome,
				task,
				timeoutMs: 20 * 6e4
			}));
			await assertCandidateResolved(preparedCandidatePath, prepared.currentCommit);
			await store.transition(job.jobId, "validating", { checks: [] });
		}, 1);
		const candidateCommit = await commitCandidate(preparedCandidatePath, prepared.upstreamCommit);
		await store.transition(job.jobId, "waiting-for-idle", {
			upstreamCommit: prepared.upstreamCommit,
			previousCommit: prepared.currentCommit,
			candidateCommit,
			checks
		});
		const baseDependencies = cutoverDependencies(job);
		const dependencies = {
			...baseDependencies,
			createSnapshot: async (dshHome, controlRoot, jobId) => {
				const snapshotPath = await baseDependencies.createSnapshot(dshHome, controlRoot, jobId);
				await store.transition(job.jobId, "applying", { snapshotPath });
				return snapshotPath;
			}
		};
		await store.transition(job.jobId, "applying");
		const result = await applyCandidate({
			repositoryRoot: job.repositoryRoot,
			dshHome: job.dshHome,
			controlRoot: job.controlRoot,
			jobId: job.jobId,
			currentCommit: prepared.currentCommit,
			candidateCommit,
			currentPid: job.runtime.currentPid
		}, dependencies);
		await store.transition(job.jobId, result.status, { snapshotPath: result.snapshotPath });
		if (result.status === "completed") {
			await removeCandidateWorktree(job.repositoryRoot, candidatePath, job.jobId);
			candidatePath = void 0;
			await pruneOwnedArtifacts(job.controlRoot, { keepSnapshot: result.snapshotPath });
		}
	} catch (error) {
		const state = await store.read().catch(() => void 0);
		if (state?.jobId === job.jobId && state.phase !== "applying") await store.transition(job.jobId, "failed", { error: error instanceof Error ? error.message : String(error) }).catch(() => void 0);
		throw error;
	} finally {
		if (candidatePath !== void 0) {
			if ((await store.read().catch(() => void 0))?.phase !== "applying") await removeCandidateWorktree(job.repositoryRoot, candidatePath, job.jobId).catch(() => void 0);
		}
		await writeFile(join(job.controlRoot, "logs", `${job.jobId}.done`), `${(/* @__PURE__ */ new Date()).toISOString()}\n`, {
			flag: "w",
			mode: 384
		}).catch(() => void 0);
	}
}
/**
* Read and execute a job file supplied as the worker's only argument.
* @param jobPath - absolute private JSON job path.
*/
async function runUpdateJobFile(jobPath) {
	await runUpdateJob(parseUpdateJob(JSON.parse(await readFile(jobPath, "utf8"))));
}
//#endregion
//#region lib/types/worker-entry.js
/** Self-executing detached worker entry. */
const jobPath = process.argv[2];
if (jobPath === void 0) throw new Error("continuous adaptation worker requires a job path");
await runUpdateJobFile(jobPath);
//#endregion
export {};
