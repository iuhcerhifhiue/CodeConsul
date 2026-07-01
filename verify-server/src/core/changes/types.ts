import { z } from "zod";
import { AgentRoleSchema } from "../plan/types";

/**
 * A single file operation an executor agent wants to make against the working
 * tree. Executors never touch disk directly — they emit these, and the Workspace
 * applies them. That separation is what lets a review gate or a dry-run sit
 * between "generated" and "written".
 */
export const FileOpSchema = z.enum(["create", "modify", "delete"]);
export type FileOp = z.infer<typeof FileOpSchema>;

export const FileChangeSchema = z.object({
  /** Repo-relative, POSIX-style path. */
  path: z.string().min(1),
  op: FileOpSchema,
  /** New file contents for create/modify (omitted for delete). */
  contents: z.string().optional(),
  /** Prior contents for modify/delete, when known — enables diffing and undo. */
  previousContents: z.string().optional(),
  /** Why this change was made. */
  note: z.string().optional(),
});
export type FileChange = z.infer<typeof FileChangeSchema>;

/** The unit an executor returns: every file change for one task. */
export const ChangeSetSchema = z.object({
  taskId: z.string(),
  agentRole: AgentRoleSchema,
  summary: z.string(),
  changes: z.array(FileChangeSchema).default([]),
  notes: z.array(z.string()).default([]),
});
export type ChangeSet = z.infer<typeof ChangeSetSchema>;

export function emptyChangeSet(taskId: string, agentRole: ChangeSet["agentRole"], summary: string): ChangeSet {
  return { taskId, agentRole, summary, changes: [], notes: [] };
}

export interface DiffStat {
  created: number;
  modified: number;
  deleted: number;
  files: number;
}

export function diffStat(cs: ChangeSet): DiffStat {
  let created = 0;
  let modified = 0;
  let deleted = 0;
  for (const c of cs.changes) {
    if (c.op === "create") created++;
    else if (c.op === "modify") modified++;
    else deleted++;
  }
  return { created, modified, deleted, files: cs.changes.length };
}

export interface ChangeSetValidation {
  ok: boolean;
  errors: string[];
}

/**
 * Guard a ChangeSet before it is applied. The path checks are a security boundary:
 * an executor must never be able to write outside the repo root or to an absolute
 * path. The op/contents checks catch malformed changes early.
 */
export function validateChangeSet(cs: ChangeSet): ChangeSetValidation {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const c of cs.changes) {
    if (seen.has(c.path)) errors.push(`duplicate path in changeset: "${c.path}"`);
    seen.add(c.path);

    if (isUnsafePath(c.path)) {
      errors.push(`unsafe path (escapes repo or is absolute): "${c.path}"`);
    }
    if ((c.op === "create" || c.op === "modify") && c.contents === undefined) {
      errors.push(`"${c.path}" is a ${c.op} but has no contents`);
    }
    if (c.op === "delete" && c.contents !== undefined) {
      errors.push(`"${c.path}" is a delete but carries contents`);
    }
  }
  return { ok: errors.length === 0, errors };
}

/** Reject absolute paths, Windows drive letters, and any `..` traversal segment. */
export function isUnsafePath(p: string): boolean {
  if (p.length === 0) return true;
  const normalized = p.replace(/\\/g, "/");
  if (normalized.startsWith("/")) return true;
  if (/^[a-zA-Z]:/.test(normalized)) return true;
  return normalized.split("/").some((seg) => seg === "..");
}
