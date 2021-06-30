export interface Diff {
  pullRequest: PullRequest;
  changedFiles: PullRequestFile[];
  repoFiles: RepositoryFile[];
}

export interface PullRequest {
  title: string;
  base: {
    sha: string;
    ref: string;
    repo: {
      default_branch: string;
    };
  };
  number: number;
}

export interface PullRequestFile {
  sha: string;
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch?: string;
  previous_filename?: string;
}

export interface RepositoryFile {
  path?: string;
  mode?: string;
  type?: string;
  sha?: string;
  size?: number;
  url?: string;
}
