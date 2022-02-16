import { PullRequest } from './PullRequest';
import { PullRequestFile } from './PullRequestFile';
import { RepositoryFile } from './RepositoryFile';

export interface Diff {
  pullRequest: PullRequest;
  changedFiles: PullRequestFile[];
  repoFiles: RepositoryFile[];
}
