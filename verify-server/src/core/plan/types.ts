import { z } from "zod";

/**
 * The roles an agent can play in Consul. The Architect tags every task with the
 * role best suited to execute it, so the orchestrator (Phase 2) knows which kind
 * of agent to dispatch. This enum is the shared vocabulary of the whole platform.
 */
export const AGENT_ROLES = [
  "architect", // plans and decomposes work (this agent)
  "scaffolder", // creates project structure, config, boilerplate
  "coder", // implements features and changes
  "tester", // writes and runs tests
  "reviewer", // reviews diffs for correctness and quality
  "integrator", // wires pieces together, handles glue / entrypoints
] as const;

export const AgentRoleSchema = z.enum(AGENT_ROLES);
export type AgentRole = z.infer<typeof AgentRoleSchema>;

/** Lifecycle of a task as it moves through the orchestrator. */
export const TaskStatusSchema = z.enum([
  "pending", // created, dependencies not yet satisfied
  "ready", // dependencies satisfied, can be picked up
  "in_progress",
  "blocked",
  "done",
  "failed",
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * A single unit of work in a Plan. Tasks form a DAG via `dependsOn`, are assigned
 * to an agent role, and carry the acceptance criteria a downstream agent (and the
 * reviewer) will be held to.
 */
export const TaskSchema = z.object({
  id: z.string().regex(KEBAB, "task id must be kebab-case"),
  title: z.string().min(3),
  description: z.string().min(1),
  agentRole: AgentRoleSchema,
  /** Files this task is expected to create or modify (best-effort, repo-relative). */
  targetFiles: z.array(z.string()).default([]),
  /** Checkable conditions that define "done" for this task. */
  acceptanceCriteria: z.array(z.string()).default([]),
  /** Ids of tasks that must complete before this one starts. */
  dependsOn: z.array(z.string()).default([]),
  /** Why the Architect included this task — useful context for the executing agent. */
  rationale: z.string().default(""),
  status: TaskStatusSchema.default("pending"),
  estimateMinutes: z.number().int().positive().optional(),
});
export type Task = z.infer<typeof TaskSchema>;

/**
 * The Architect's output: a validated, dependency-ordered plan for achieving the
 * user's goal in the context of a specific repository.
 */
export const PlanSchema = z.object({
  id: z.string(),
  goal: z.string().min(1),
  summary: z.string(),
  tasks: z.array(TaskSchema).min(1),
  risks: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  createdAt: z.string(),
  meta: z.object({
    /** Which ReasoningProvider produced the decomposition. */
    reasoningProvider: z.string(),
    /** True once an LLM (e.g. Claude) enriched the plan; false for the heuristic engine. */
    enrichedByLLM: z.boolean(),
    /** Short signature of the repo state the plan was built against. */
    repoSignature: z.string(),
  }),
});
export type Plan = z.infer<typeof PlanSchema>;

/* -------------------------------------------------------------------------- */
/*  Loose draft shapes                                                         */
/*                                                                            */
/*  A ReasoningProvider returns a *draft*, not a finished Plan. Ids may be     */
/*  missing, defaults absent. The Architect normalizes and validates a draft   */
/*  into a canonical Plan. This is the seam where a future ClaudeProvider's    */
/*  JSON output plugs in: parse it into a PlanDraft, then run the exact same    */
/*  normalization and validation path the heuristic engine uses.               */
/* -------------------------------------------------------------------------- */

export interface TaskDraft {
  id?: string;
  title: string;
  description: string;
  agentRole: AgentRole;
  targetFiles?: string[];
  acceptanceCriteria?: string[];
  dependsOn?: string[];
  rationale?: string;
  estimateMinutes?: number;
}

export interface PlanDraft {
  summary: string;
  tasks: TaskDraft[];
  risks?: string[];
  assumptions?: string[];
}
