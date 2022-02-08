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
