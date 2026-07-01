export type ReviewLevel = "pass" | "warn" | "fail";

export interface ReviewFinding {
  level: ReviewLevel;
  message: string;
  taskId?: string;
}

/** The Reviewer's output: an approval decision plus the findings behind it. */
export interface ReviewVerdict {
  approved: boolean;
  summary: string;
  findings: ReviewFinding[];
}
