import type { ReviewFinding } from "../review/types";
import type { ProjectType, RepoContext } from "../workspace/Workspace";

/**
 * One parsed problem from a verification run. Best-effort: the verifier always
 * keeps the raw {@link VerificationResult.output} too, so a repair pass has the
 * full picture even when parsing misses something.
 */
export interface VerificationFailure {
  /** Short label — a test name, error code (e.g. "TS2322"), or "FAIL". */
  label: string;
  /** The human-readable detail line(s). */
  detail: string;
  /** Implicated file, repo-relative, when the output named one. */
  file?: string;
}

/**
 * The outcome of actually running the project's checks. This is what turns
 * Consul from "generates plausible code" into "generates code it verified" —
 * the keyless floor of Phase 6.
 */
export interface VerificationResult {
  /** Did we find a command to run at all? `false` = nothing to verify (skipped). */
  ran: boolean;
  /** The command we ran (e.g. "npm run test"), or null when `ran` is false. */
  command: string | null;
  /** Process exit code, null on spawn failure / signal / when not run. */
  exitCode: number | null;
  passed: boolean;
  durationMs: number;
  /** Best-effort parsed failures, for the human summary and the repair prompt. */
  failures: VerificationFailure[];
  /** Combined stdout+stderr, truncated. Fed verbatim into a repair pass. */
  output: string;
  /** One-line human summary. */
  summary: string;
}

export interface VerifyRequest {
  /** Absolute repo root to run the check in. */
  root: string;
  /** Deterministic repo analysis — used to choose the right command. */
  repo: RepoContext;
  /** Hard ceiling for the child process; the verifier kills it past this. */
  timeoutMs?: number;
}

/**
 * The pluggable verification backend — the fourth seam, alongside reasoning,
 * codegen, and review. The deterministic {@link CommandVerifier} runs the repo's
 * own test/typecheck command with no key; a CI-backed verifier could slot in
 * behind the same interface later.
 */
export interface Verifier {
  readonly id: string;
  verify(req: VerifyRequest): Promise<VerificationResult>;
}

/**
 * What a repair pass is told. Produced from a failed {@link VerificationResult}
 * (plus any blocking review findings) and threaded into {@link CodeRequest} so a
 * Claude-backed coder can fix the implicated files. The deterministic scaffolder
 * ignores it — repair is the LLM enrichment; verification is the floor.
 */
export interface RepairFeedback {
  /** 1-based repair attempt (the initial build is attempt 1; repairs start at 2). */
  attempt: number;
  /** The command that failed, for context. */
  command: string | null;
  failures: VerificationFailure[];
  reviewFindings: ReviewFinding[];
  /** Raw verifier output (truncated), so the coder sees the actual errors. */
  output: string;
}

export type { ProjectType };
