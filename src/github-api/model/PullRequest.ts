export interface IssueWithEvents {
  issue: Issue;
  issueEventTypes: IssueEventTypes[];
}

export interface IssueEventTypes {
  id?: number;
  node_id?: string;
  url?: string;
  event?: string;
  commit_url?: string;
  created_at?: string;
  // assignee?: Assignee;
}

export interface Issue {
  state: string;
  labels: string | typedLabel[];
  assignee: Assignee;
  assignees?: Assignees[];
  milestone: Milestones;
  created_at: string;
  updated_at: string;
  closed_at: string;
  title: string;
  id: number;
  number: number;
  node_id: string;
  locked: boolean;
}
export interface Releases {
  url: string;
  id: number;
  node_id: string;
  name: string;
  created_at: string;
  published_at: string;
}

export interface Labels {
  id?: number;
  node_id?: string;
  url?: string;
  name?: string;
  color?: string;
  default?: boolean;
  description?: string;
}

// type union, because type of REST api response from octokit
// for labels is this
export type typedLabel = string | Labels;

export interface Assignee {
  login: string;
  id: number;
  node_id: string;
  type: string;
  site_admin: boolean;
}

export interface Assignees {
  login: string;
  node_id: string;
  id: number;
  type: string;
  site_admin: boolean;
}

export interface Milestones {
  id: number;
  node_id: string;
  number: number;
  state: string;
  title: string;
  description: string;
  open_issues: number;
  closed_issues: number;
  created_at: string;
  updated_at: string;
  closed_at: string;
  due_on: string;
}

export interface Pull_request {
  url: string;
}

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
  url: string;
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

export interface Language {
  [key: string]: number;
}

export interface Commit {
  url: string;
  login: string;
  timestamp: string;
}
