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
  created_at: string;
  updated_at: string;
  closed_at: string;
  merged_at: string;
}
