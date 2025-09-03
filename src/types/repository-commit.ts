import type { RepositoryUser } from "./repository-user";

// GitHub "List commits" item → https://docs.github.com/rest/commits/commits#list-commits
export interface RepositoryCommit {
  sha: string;
  node_id: string;
  commit: GitCommit;                // metadata from the commit object itself
  url: string;                      // API URL for this commit
  html_url: string;                 // Web URL for this commit
  comments_url: string;
  author: RepositoryUser | null;        // GitHub account (may be null if email not linked)
  committer: RepositoryUser | null;     // GitHub account (may be null)
  parents: GitParent[];             // parent commits
}

export interface GitCommit {
  author: GitCommitAuthor;          // name/email/date from the commit
  committer: GitCommitAuthor;       // name/email/date from the commit
  message: string;
  tree: { sha: string; url: string };
  url: string;
  comment_count: number;
  verification: GitCommitVerification;
}

export interface GitCommitAuthor {
  name: string;
  email: string;
  date: string;                     // ISO date
}

export interface GitCommitVerification {
  verified: boolean;
  reason: string;
  signature: string | null;
  payload: string | null;
  // Some repos may include extra fields; keep optional:
  verified_at?: string | null;
  verifier?: RepositoryUser | null;
}

export interface GitParent {
  sha: string;
  url: string;
  html_url: string;
}
